// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { invariant } from '@likec4/core'
import type {
  BuildOptions,
  Cancellation,
  FileSystemNode,
  LangiumDocument,
  LangiumDocumentFactory,
} from 'langium'
import { DefaultWorkspaceManager, Disposable } from 'langium'
import pTimeout from 'p-timeout'
import { filter, hasAtLeast, isNot, pipe, sort, uniqueBy } from 'remeda'
import type { WorkspaceFolder } from 'vscode-languageserver'
import { URI } from 'vscode-uri'
import type { FileNode, FileSystemProvider } from '../filesystem'
import * as BuiltIn from '../likec4lib'
import { serverLogger } from '../logger'
import type { LikeC4SharedServices } from '../module'
import { compareByUri } from '../utils'

export class LikeC4WorkspaceManager extends DefaultWorkspaceManager {
  protected override readonly fileSystemProvider: FileSystemProvider

  #logger = serverLogger.getChild('workspace')

  /**
   * Whether the workspace is ready (promise from DefaultWorkspaceManager resolved)
   * Used by ProjectManager in "sync mode"
   */
  #performedStartup = false

  #cacheEvicters = [] as Array<() => void>

  override initialBuildOptions: BuildOptions = {
    eagerLinking: true,
    validation: true,
  }

  constructor(private services: LikeC4SharedServices) {
    super(services)
    this.fileSystemProvider = services.workspace.FileSystemProvider
  }

  protected get documentFactory(): LangiumDocumentFactory {
    return this.services.workspace.LangiumDocumentFactory
  }

  /**
   * Whether the workspace is ready, use {@link ready} promise to wait for it
   */
  get isReady(): boolean {
    return this.#performedStartup
  }

  /**
   * First load all project config files, then load all documents in the workspace.
   */
  protected override async performStartup(folders: WorkspaceFolder[]): Promise<LangiumDocument[]> {
    if (this.#performedStartup) {
      this.#logger.warn`workspace already initialized, invalid performStartup call`
    }
    try {
      this.#performedStartup = false
      await this.readExcludeConfig()
      this.folders ??= folders
      const folderUris = folders.map(folder => URI.parse(folder.uri))
      const configFiles = [] as FileSystemNode[]
      const likec4Files = [] as FileSystemNode[]
      for (const folderUri of folderUris) {
        this.#logger.debug`scanning folder ${folderUri.fsPath} for likec4`
        // Scan for project config files
        try {
          const found = await this.fileSystemProvider.scanProjectFiles(folderUri)
          configFiles.push(...found)
        } catch (error) {
          this.#logger.warn(`Failed to scan workspace folder {folder} for project config files`, {
            folder: folderUri.fsPath,
            error,
          })
        }
        // Scan for likec4 files
        try {
          likec4Files.push(
            ...await this.fileSystemProvider.readDirectory(folderUri, { recursive: true }),
          )
        } catch (error) {
          this.#logger.warn(`Failed to read workspace folder {folder} for likec4 files`, {
            folder: folderUri.fsPath,
            error,
          })
        }

        // Add watch for the folder
        this.services.workspace.FileSystemWatcher.watch(folderUri.fsPath)
      }

      // Project config files
      const projectsManager = this.services.workspace.ProjectsManager
      let projectsCount = 0
      for (const entry of configFiles) {
        try {
          await projectsManager.registerConfigFile(entry.uri)
          projectsCount++
        } catch (error) {
          this.#logger.warn(`Failed to register config file {config}`, {
            config: entry.uri.fsPath,
            error,
          })
        }
      }
      if (configFiles.length !== projectsCount) {
        this.#logger.warn`loaded ${projectsCount} projects out of ${configFiles.length}`
      } else if (projectsCount > 0) {
        this.#logger.info`loaded ${projectsCount} projects`
      }

      if (projectsCount > 0) {
        likec4Files.push(...await this.scanProjectIncludePaths())
      }

      const documents = await this.loadDocuments(likec4Files)

      if (hasAtLeast(documents, 1)) {
        this.#logger.debug`found ${documents.length} likec4 documents`
      } else {
        this.#logger.warn('No likec4 documents found in workspace')
      }

      // Add built-in library
      documents.push(
        this.documentFactory.fromString(BuiltIn.Content, URI.parse(BuiltIn.Uri)),
      )

      // Add documents to Langium workspace and assign project IDs
      for (const doc of documents) {
        this.saveAddDocument(doc)
      }
      return documents
    } finally {
      this.#performedStartup = true
      // Resolve the ready promise to indicate that workspace startup is complete
      this._ready.resolve()
    }
  }

  /**
   * Scans all include paths (from all projects) and returns found likec4 files
   */
  protected async scanProjectIncludePaths(): Promise<FileSystemNode[]> {
    // Load documents from project include paths
    const includePaths = this.services.workspace.ProjectsManager.getAllIncludePaths()
    if (!hasAtLeast(includePaths, 1)) {
      return []
    }

    const isNotExcludedByWorkspace = isNot((f: FileNode) =>
      this.services.workspace.ProjectsManager.isExcludedByWorkspace(f.uri)
    )

    const foundFiles = [] as FileSystemNode[]

    for (const { projectId, includePath, includeConfig } of includePaths) {
      try {
        this.#logger.debug`scanning include path ${includePath.fsPath} for project ${projectId}`
        const files = pipe(
          await this.fileSystemProvider.readDirectory(includePath, {
            recursive: true,
            maxDepth: includeConfig.maxDepth,
          }),
          filter(isNotExcludedByWorkspace),
        )
        foundFiles.push(...files)
        if (files.length !== 0) {
          this.#logger.debug`loaded ${files.length} files from include path ${includePath.fsPath}`
          if (files.length > includeConfig.fileThreshold) {
            this.#logger.warn(
              `Loaded ${files.length} files from include path ${includePath.fsPath} (project: ${projectId}) (threshold: ${includeConfig.fileThreshold}).\n` +
                'Large include directories may slow workspace initialization. ' +
                'Consider adjusting "include.fileThreshold" or "include.maxDepth" in your project configuration.',
            )
          }
        } else {
          this.#logger.trace`no files found in include path ${includePath.fsPath}`
        }
      } catch (error) {
        this.#logger.warn(`Failed to scan include path ${includePath.fsPath}`, { error })
      }
    }
    return foundFiles
  }

  protected async loadDocuments(files: FileSystemNode[]): Promise<LangiumDocument[]> {
    const sorted = pipe(
      files,
      uniqueBy(f => f.uri.path),
      sort(compareByUri),
    )
    const documents = [] as LangiumDocument[]
    for (const file of sorted) {
      try {
        documents.push(await this.documentFactory.fromUri(file.uri))
      } catch (error) {
        this.#logger.warn(`Failed to load document ${file.uri}`, { error })
      }
    }
    return documents
  }

  protected saveAddDocument(document: LangiumDocument): void {
    if (!this.langiumDocuments.hasDocument(document.uri)) {
      this.langiumDocuments.addDocument(document)
    }
  }

  public workspace(): WorkspaceFolder | null {
    if (this.folders && hasAtLeast(this.folders, 1)) {
      return this.folders[0]
    }
    return null
  }

  public async rebuildAll(cancelToken?: Cancellation.CancellationToken): Promise<void> {
    const uris = this.services.workspace.LangiumDocuments.resetProjectIds()
    this.#logger.info('invalidate and rebuild all {docs} documents', { docs: uris.length })
    this.forceCleanCaches()
    await this.documentBuilder.update(uris, [], cancelToken)
  }

  public get workspaceUri(): URI {
    const workspace = this.workspace()
    invariant(workspace, 'Workspace not initialized')
    return URI.parse(workspace.uri)
  }

  public get workspaceURL(): URL {
    const workspace = this.workspace()
    invariant(workspace, 'Workspace not initialized')
    return new URL(workspace.uri)
  }

  /**
   * Force clean all caches
   */
  public forceCleanCaches() {
    for (const listener of [...this.#cacheEvicters]) {
      listener()
    }
    this.services.workspace.ProjectsManager.clearCaches()
    this.services.workspace.ManualLayouts.clearCaches()
    this.services.workspace.Cache.clear()
  }

  /**
   * Register a listener to be called when caches are force cleaned
   */
  public onForceCleanCache(listener: () => void): Disposable {
    this.#cacheEvicters.push(listener)
    return Disposable.create(() => {
      const index = this.#cacheEvicters.indexOf(listener)
      if (index !== -1) {
        this.#cacheEvicters.splice(index, 1)
      }
    })
  }

  /**
   * Read workspace exclude patterns from configuration before workspace scan.
   * Uses a timeout fallback for third-party IDEs that may not support workspace/configuration.
   */
  private async readExcludeConfig(): Promise<void> {
    if (!this.services.lsp.Connection) {
      this.#logger.debug`no LSP connection, skipping initial configuration read`
      return
    }
    const configProvider = this.services.workspace.ConfigurationProvider
    const wait = <T>(promise: Promise<T>) => pTimeout(promise, { milliseconds: 1000, message: false })
    try {
      this.#logger.trace`waiting for ConfigurationProvider ready...`
      await wait(configProvider.ready)
      this.#logger.trace`ConfigurationProvider ready, reading exclude patterns...`
      const excludeConfig = await wait<string[]>(
        configProvider.getConfiguration('likec4', 'exclude'),
      )
      if (excludeConfig) {
        this.#logger.trace`exclude configuration found ${excludeConfig}`
        this.services.workspace.ProjectsManager.setWorkspaceExcludePatterns(excludeConfig)
      } else {
        this.#logger.trace('no initial exclude configuration found')
      }
    } catch (e) {
      this.#logger.warn('Failed to read initial exclude configuration', { error: e })
    }
  }
}
