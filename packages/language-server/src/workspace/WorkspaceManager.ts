import { invariant } from '@likec4/core'
import type { BuildOptions, FileSelector, FileSystemNode, LangiumDocument, LangiumDocumentFactory } from 'langium'
import { DefaultWorkspaceManager } from 'langium'
import { hasAtLeast } from 'remeda'
import type { WorkspaceFolder } from 'vscode-languageserver'
import { URI } from 'vscode-uri'
import type { FileSystemProvider } from '../filesystem'
import * as BuiltIn from '../likec4lib'
import { logWarnError } from '../logger'
import type { LikeC4SharedServices } from '../module'

export class LikeC4WorkspaceManager extends DefaultWorkspaceManager {
  protected readonly documentFactory: LangiumDocumentFactory
  protected override readonly fileSystemProvider: FileSystemProvider

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
        await projects.loadConfigFile(entry)
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
    collector(this.documentFactory.fromString(BuiltIn.Content, URI.parse(BuiltIn.Uri)))
    await super.loadAdditionalDocuments(folders, collector)
  }

  /**
   * Determine whether the given folder entry shall be included while indexing the workspace.
   */
  protected override includeEntry(
    _workspaceFolder: WorkspaceFolder,
    entry: FileSystemNode,
    selector: FileSelector,
  ): boolean {
    if (this.services.workspace.ProjectsManager.isConfigFile(entry.uri)) {
      return false
    }
    if (entry.isFile) {
      return !this.services.workspace.ProjectsManager.checkIfExcluded(entry.uri)
    }
    return super.includeEntry(_workspaceFolder, entry, selector)
  }

  public workspace() {
    if (this.folders && hasAtLeast(this.folders, 1)) {
      return this.folders[0]
    }
    return null
  }

  public get workspaceUri() {
    const workspace = this.workspace()
    invariant(workspace, 'Workspace not initialized')
    return URI.parse(workspace.uri)
  }

  public get workspaceURL() {
    const workspace = this.workspace()
    invariant(workspace, 'Workspace not initialized')
    return new URL(workspace.uri)
  }
}
