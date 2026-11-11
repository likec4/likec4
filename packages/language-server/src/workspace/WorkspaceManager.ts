// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { invariant, memoizeProp } from '@likec4/core'
import { onNextTick } from '@likec4/core/utils'
import type {
  BuildOptions,
  Cancellation,
  FileSystemNode,
  LangiumDocument,
  LangiumDocumentFactory,
} from 'langium'
import { DefaultWorkspaceManager, Disposable, isOperationCancelled, UriUtils } from 'langium'
import pTimeout from 'p-timeout'
import { filter, hasAtLeast, isNot, map, pipe, sort, uniqueBy } from 'remeda'
import type { WorkspaceFolder } from 'vscode-languageserver'
import { URI } from 'vscode-uri'
import { isLikeC4UserDocument } from '../ast'
import type { FileNode, FileSystemProvider } from '../filesystem'
import * as BuiltIn from '../likec4lib'
import { serverLogger } from '../logger'
import type { LikeC4SharedServices } from '../module'
import { compareByUri } from '../utils'
import type { ExternalDependencyTarget, ExternalProject, ExternalProjectId } from './ExternalProjects'

function sameKeys(a: ReadonlyMap<string, unknown>, b: ReadonlyMap<string, unknown>): boolean {
  return a.size === b.size && [...a.keys()].every(k => b.has(k))
}

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
    // Projects configuration changed outside of a full reload (e.g. single config file changed):
    // add or remove external projects if dependencies changed
    // (a full reload syncs external projects in rebuildAll)
    onNextTick(() => {
      services.workspace.ProjectsManager.onProjectsUpdate(() => {
        this.scheduleExternalProjectsSync()
      })
    })
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
      this.#logger.error`workspace already initialized, invalid performStartup call`
    }
    try {
      this.#performedStartup = false
      await this.readExcludeConfig()
      if (!this.folders || this.folders.length === 0) {
        this.folders = folders
      }
      const folderUris = folders.map(folder => URI.parse(folder.uri))
      const configFiles = [] as FileSystemNode[]
      const likec4Files = [] as FileSystemNode[]
      for (const folderUri of folderUris) {
        this.#logger.debug`scanning folder ${folderUri.fsPath} for likec4`
        let hasLikeC4Files = false
        // Scan for project config files
        try {
          const found = await this.fileSystemProvider.scanProjectFiles(folderUri)
          hasLikeC4Files = found.length > 0
          configFiles.push(...found)
        } catch (error) {
          this.#logger.warn(`Failed to scan workspace folder {folder} for project config files`, {
            folder: folderUri.fsPath,
            error,
          })
        }
        // Scan for likec4 files
        try {
          const found = await this.fileSystemProvider.readDirectory(folderUri, { recursive: true })
          hasLikeC4Files = hasLikeC4Files || found.length > 0
          likec4Files.push(...found)
        } catch (error) {
          this.#logger.warn(`Failed to read workspace folder {folder} for likec4 files`, {
            folder: folderUri.fsPath,
            error,
          })
        }

        // Add watch for the folder
        if (hasLikeC4Files) {
          this.services.workspace.FileSystemWatcher.watch(folderUri.fsPath)
        } else {
          this.#logger.trace`no likec4 files found in folder ${folderUri.fsPath}`
        }
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

      // Dependencies outside the workspace
      if (projectsCount > 0) {
        documents.push(...await this.startupExternalProjects())
      }

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
   * Traverse the file system folder identified by the given URI and its subfolders. All
   * contained files that match the file extensions are added to the `uris` array.
   */
  protected override async traverseFolder(folderPath: URI, uris: URI[]): Promise<void> {
    try {
      const entries = await this.fileSystemProvider.readDirectory(folderPath, { recursive: true })
      uris.push(...pipe(
        entries,
        filter(e => e.isFile),
        map(e => e.uri),
      ))
    } catch (e) {
      console.error('Failure to read directory content of ' + folderPath.toString(true), e)
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
        if (this.langiumDocuments.hasDocument(file.uri)) {
          documents.push(this.langiumDocuments.getDocument(file.uri)!)
          continue
        }
        documents.push(
          await this.documentFactory.fromUri(file.uri),
        )
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
    // Re-read external projects (dependencies outside the workspace):
    // changes in them are picked up on reload of projects
    const sync = this.syncExternalProjects(cancelToken)
    this.#activeSync = sync
    try {
      await sync
    } catch (error) {
      if (isOperationCancelled(error)) {
        throw error
      }
      this.#logger.warn('Failed to sync external projects', { error })
    } finally {
      if (this.#activeSync === sync) {
        this.#activeSync = null
      }
    }
    const uris = this.services.workspace.LangiumDocuments.resetProjectIds()
    this.#logger.info('invalidate and rebuild all {docs} documents', { docs: uris.length })
    this.forceCleanCaches()
    await this.documentBuilder.update(uris, [], cancelToken)
  }

  public get workspaceUri(): URI {
    if (!this.#performedStartup) {
      this.#logger.warn('Workspace not initialized, returning empty URI')
      return URI.parse('file:///')
    }
    return memoizeProp(this, 'workspaceUri', () => {
      const workspace = this.workspace()
      invariant(workspace, 'Workspace not initialized')
      return URI.parse(workspace.uri)
    })
  }

  /**
   * Returns relative path from workspace to the given URI
   */
  public relativePath(uri: URI | string): string {
    if (!this.#performedStartup) {
      this.#logger.warn('Workspace not initialized, returning empty string')
      return ''
    }
    return UriUtils.relative(this.workspaceUri, uri)
  }

  public get workspaceURL(): URL {
    if (!this.#performedStartup) {
      this.#logger.warn('Workspace not initialized, returning empty URL')
      return new URL('file:///')
    }
    return memoizeProp(this, 'workspaceURL', () => {
      const workspace = this.workspace()
      invariant(workspace, 'Workspace not initialized')
      return new URL(workspace.uri)
    })
  }

  /**
   * Force clean all caches
   */
  public forceCleanCaches() {
    // Copy the array to avoid modification during iteration
    const cacheEvicters = [...this.#cacheEvicters]
    for (const listener of cacheEvicters) {
      try {
        listener()
      } catch (error) {
        this.#logger.warn('Error in cache evicter', { error })
      }
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
   * Loads external projects (dependencies outside the workspace) on startup,
   * registers them and returns their documents (to be added to the workspace).
   */
  protected async startupExternalProjects(): Promise<LangiumDocument[]> {
    const externalProjects = this.services.workspace.ExternalProjects
    const documents = [] as LangiumDocument[]
    try {
      const loaded = await externalProjects.loadAll()
      for (const project of loaded) {
        externalProjects.register(project)
        for (const [uri, text] of project.files) {
          documents.push(this.documentFactory.fromString(text, URI.parse(uri)))
        }
      }
      if (loaded.length > 0) {
        this.#logger.info`loaded ${loaded.length} external projects`
      }
    } catch (error) {
      this.#logger.warn('Failed to load external projects', { error })
    }
    return documents
  }

  /**
   * Re-reads external projects (dependencies outside the workspace) and applies changes.
   * Files are read before any change is made.
   *
   * @returns URIs of documents of workspace projects that depend on changed instances
   */
  protected async syncExternalProjects(cancelToken?: Cancellation.CancellationToken): Promise<URI[]> {
    const externalProjects = this.services.workspace.ExternalProjects
    const targets = externalProjects.dependencyTargets()
    if (targets.size === 0 && externalProjects.all().length === 0) {
      return []
    }
    const loaded = await externalProjects.loadAll(targets)
    return await this.applyExternalProjects(targets, loaded, cancelToken)
  }

  /**
   * Applies loaded external projects:
   * - removes instances that are not referenced anymore, with their documents
   * - adds new instances and their documents
   * - replaces documents with changed content
   *
   * Added documents are not built here: they are built by the next document builder update.
   *
   * @returns URIs of documents of workspace projects that depend on changed instances
   */
  protected async applyExternalProjects(
    targets: ReadonlyMap<ExternalProjectId, ExternalDependencyTarget>,
    loaded: ReadonlyArray<ExternalProject>,
    cancelToken?: Cancellation.CancellationToken,
  ): Promise<URI[]> {
    const externalProjects = this.services.workspace.ExternalProjects
    const next = new Map(loaded.map(p => [p.id, p]))

    const changedProjects = new Set<ExternalProjectId>()
    const deleted = [] as URI[]
    for (const previous of externalProjects.all()) {
      const project = next.get(previous.id)
      if (!project) {
        changedProjects.add(previous.id)
      }
      for (const [uri, text] of previous.files) {
        if (project?.files.get(uri) !== text) {
          changedProjects.add(previous.id)
          deleted.push(URI.parse(uri))
        }
      }
    }
    const added = [] as Array<[uri: string, text: string]>
    for (const project of loaded) {
      const previous = externalProjects.get(project.id)
      if (!previous) {
        changedProjects.add(project.id)
      }
      for (const [uri, text] of project.files) {
        if (previous?.files.get(uri) !== text) {
          changedProjects.add(project.id)
          added.push([uri, text])
        }
      }
    }

    // Remove documents while they are still owned by the instances
    if (deleted.length > 0) {
      await this.documentBuilder.update([], deleted, cancelToken)
    }
    for (const previous of externalProjects.all()) {
      if (!next.has(previous.id)) {
        this.#logger.info`remove external project ${previous.id}`
        externalProjects.unregister(previous.id)
      }
    }
    for (const project of loaded) {
      externalProjects.register(project)
    }
    for (const [uri, text] of added) {
      const docUri = URI.parse(uri)
      if (!this.langiumDocuments.hasDocument(docUri)) {
        this.langiumDocuments.addDocument(this.documentFactory.fromString(text, docUri))
      }
    }

    if (changedProjects.size === 0) {
      return []
    }
    this.#logger.debug`external projects changed: ${[...changedProjects].join(', ')}`
    // Consumers of changed instances
    // (consumers of removed instances have changed config, they are rebuilt by the projects manager)
    const consumers = new Set<string>()
    for (const id of changedProjects) {
      targets.get(id)?.consumers.forEach(c => consumers.add(c))
    }
    if (consumers.size === 0) {
      return []
    }
    const lookup = this.services.workspace.ProjectsLookup
    return this.langiumDocuments.all
      .filter(doc =>
        isLikeC4UserDocument(doc)
        && !lookup.isExcluded(doc)
        && consumers.has(lookup.ownerProjectId(doc))
      )
      .map(doc => doc.uri)
      .toArray()
  }

  #scheduledSync: Promise<void> | null = null
  /**
   * Sync of external projects running as part of {@link rebuildAll}
   */
  #activeSync: Promise<unknown> | null = null

  /**
   * Schedules sync of external projects, if dependencies of workspace projects changed
   * (instances have to be added or removed).
   * Files are read outside of the workspace lock, the lock is taken to register documents
   * and rebuild the documents of consumers.
   */
  protected scheduleExternalProjectsSync(): void {
    if (!this.#performedStartup || this.#scheduledSync) {
      return
    }
    const externalProjects = this.services.workspace.ExternalProjects
    // Deferred: if the update is part of a reload of projects, the reload syncs external projects itself
    // (in rebuildAll, called right after the update), so wait for it first
    this.#scheduledSync = Promise.resolve()
      .then(async () => {
        while (this.#activeSync) {
          await this.#activeSync.catch(() => {})
        }
        this.#scheduledSync = null
        let targets = externalProjects.dependencyTargets()
        if (!externalProjects.hasStructuralChanges(targets)) {
          return
        }
        // Read files outside of the lock
        let loaded = await externalProjects.loadAll(targets)
        await this.services.workspace.WorkspaceLock.write(async token => {
          const current = externalProjects.dependencyTargets()
          if (!externalProjects.hasStructuralChanges(current)) {
            // Already synced (e.g. by a reload of projects)
            return
          }
          if (!sameKeys(current, targets)) {
            // Dependencies changed while loading
            targets = current
            loaded = await externalProjects.loadAll(targets)
          }
          const consumerDocs = await this.applyExternalProjects(targets, loaded, token)
          // Builds added documents and relinks consumers
          await this.documentBuilder.update(consumerDocs, [], token)
        })
      })
      .catch(error => {
        this.#scheduledSync = null
        this.#logger.warn('Failed to sync external projects', { error })
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
