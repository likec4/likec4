import { invariant } from '@likec4/core'
import type {
  BuildOptions,
  Cancellation,
  FileSelector,
  FileSystemNode,
  LangiumDocument,
  LangiumDocumentFactory,
} from 'langium'
import { DefaultWorkspaceManager, Disposable, UriUtils } from 'langium'
import { hasAtLeast, uniqueBy } from 'remeda'
import type { WorkspaceFolder } from 'vscode-languageserver'
import { URI } from 'vscode-uri'
import type { FileNode, FileSystemProvider } from '../filesystem'
import { excludeNodeModules } from '../filesystem/utils'
import * as BuiltIn from '../likec4lib'
import { logger, logWarnError } from '../logger'
import type { LikeC4SharedServices } from '../module'

export class LikeC4WorkspaceManager extends DefaultWorkspaceManager {
  protected readonly documentFactory: LangiumDocumentFactory
  protected override readonly fileSystemProvider: FileSystemProvider

  #cacheEvicters = [] as Array<() => void>

  override initialBuildOptions: BuildOptions = {
    eagerLinking: true,
    validation: true,
  }

  constructor(private services: LikeC4SharedServices) {
    super(services)
    this.documentFactory = services.workspace.LangiumDocumentFactory
    this.fileSystemProvider = services.workspace.FileSystemProvider
  }

  /**
   * First load all project config files, then load all documents in the workspace.
   */
  protected override async performStartup(folders: WorkspaceFolder[]): Promise<LangiumDocument[]> {
    this.folders ??= folders
    const configFiles = [] as FileSystemNode[]
    for (const folder of folders) {
      try {
        const uri = URI.parse(folder.uri)
        const found = await this.fileSystemProvider.scanProjectFiles(uri)
        configFiles.push(...found)
        this.services.workspace.FileSystemWatcher.watch(uri.fsPath)
      } catch (error) {
        logWarnError(error)
      }
    }
    // Project config files
    const projects = this.services.workspace.ProjectsManager
    for (const entry of configFiles) {
      try {
        await projects.registerConfigFile(entry.uri)
      } catch (error) {
        logWarnError(error)
      }
    }
    return await super.performStartup(folders)
  }

  /**
   * Load all additional documents that shall be visible in the context of the given workspace
   * folders and add them to the collector. This can be used to include built-in libraries of
   * your language, which can be either loaded from provided files or constructed in memory.
   */
  protected override async loadAdditionalDocuments(
    folders: WorkspaceFolder[],
    collector: (document: LangiumDocument) => void,
  ): Promise<void> {
    // Built-in library
    collector(this.documentFactory.fromString(BuiltIn.Content, URI.parse(BuiltIn.Uri)))

    // Load documents from project include paths
    const includePaths = this.services.workspace.ProjectsManager.getAllIncludePaths()
    let totalFilesLoaded = 0

    const foundFiles = [] as FileNode[]

    for (const { projectId, includePath, includeConfig } of includePaths) {
      try {
        logger.debug`scanning include path ${includePath.fsPath} for project ${projectId}`
        const files = await this.fileSystemProvider.readDirectory(includePath, {
          recursive: true,
          maxDepth: includeConfig.maxDepth,
        })
        foundFiles.push(...files)
        if (files.length === 0) {
          logger.debug`loaded ${files.length} files from include path ${includePath.fsPath}`
        }
      } catch (error) {
        logger.warn(`Failed to scan include path ${includePath.fsPath}`, { error })
      }
    }

    for (const file of uniqueBy(foundFiles, (f) => f.uri.path)) {
      try {
        const doc = await this.langiumDocuments.getOrCreateDocument(file.uri)
        collector(doc)
        totalFilesLoaded++
      } catch (error) {
        logger.warn(`Failed to load document ${file.uri.fsPath}`, { error })
      }
    }

    // Warn if total files loaded exceeds threshold across all include paths
    if (includePaths.length > 0 && totalFilesLoaded > 0) {
      // Get the minimum threshold from all projects
      const minThreshold = Math.min(...includePaths.map(p => p.includeConfig.fileThreshold))

      if (totalFilesLoaded > minThreshold) {
        logger.warn(
          `Loaded ${totalFilesLoaded} files from include paths (threshold: ${minThreshold}). ` +
            'Large include directories may slow workspace initialization. ' +
            'Consider adjusting "include.fileThreshold" or "include.maxDepth" in your project configuration.',
        )
      } else {
        logger.info`loaded ${totalFilesLoaded} total files from ${includePaths.length} include paths`
      }
    }
  }

  /**
   * Determine whether the given folder entry shall be included while indexing the workspace.
   */
  protected override includeEntry(_: WorkspaceFolder, entry: FileSystemNode, selector: FileSelector): boolean {
    const name = UriUtils.basename(entry.uri)
    if (entry.isDirectory) {
      return !excludeNodeModules(name)
    } else if (entry.isFile) {
      const selected = selector.fileExtensions.includes(UriUtils.extname(entry.uri)) ||
        selector.fileNames.includes(name)
      return selected && !this.services.workspace.ProjectsManager.isExcluded(entry.uri)
    }
    return false
  }

  public workspace(): WorkspaceFolder | null {
    if (this.folders && hasAtLeast(this.folders, 1)) {
      return this.folders[0]
    }
    return null
  }

  public async rebuildAll(cancelToken?: Cancellation.CancellationToken): Promise<void> {
    const uris = this.services.workspace.LangiumDocuments.resetProjectIds()
    logger.info('invalidate and rebuild all {docs} documents', { docs: uris.length })
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
    for (const listener of this.#cacheEvicters) {
      listener()
    }
    this.services.workspace.ManualLayouts.clearCaches()
    this.services.workspace.Cache.clear()
  }

  /**
   * Register a listener to be called when caches are force cleaned
   */
  public onForceCleanCache(listener: () => void): Disposable {
    this.#cacheEvicters.push(listener)
    return Disposable.create(() => {
      this.#cacheEvicters = this.#cacheEvicters.filter(l => l !== listener)
    })
  }
}
