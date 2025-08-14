import { hasAtLeast, invariant } from '@likec4/core'
import type { FileSelector, FileSystemNode, LangiumDocument, LangiumDocumentFactory } from 'langium'
import { DefaultWorkspaceManager } from 'langium'
import type { WorkspaceFolder } from 'vscode-languageserver'
import { URI } from 'vscode-uri'
import * as BuiltIn from '../likec4lib'
import { logError } from '../logger'
import type { LikeC4SharedServices } from '../module'

export class LikeC4WorkspaceManager extends DefaultWorkspaceManager {
  private documentFactory: LangiumDocumentFactory

  constructor(private services: LikeC4SharedServices) {
    super(services)
    this.documentFactory = services.workspace.LangiumDocumentFactory
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
    const projects = this.services.workspace.ProjectsManager
    for (const folder of folders) {
      try {
        const content = await this.fileSystemProvider.readDirectory(URI.parse(folder.uri))
        // First load project config files
        for (const entry of content) {
          try {
            await projects.loadConfigFile(entry)
          } catch (error) {
            logError(error)
          }
        }
      } catch (error) {
        logError(error)
      }
    }

    collector(this.documentFactory.fromString(BuiltIn.Content, URI.parse(BuiltIn.Uri)))
    await super.loadAdditionalDocuments(folders, collector)
  }

  // /**
  //  * We override the default implementation to process project config files during the traversal.
  //  * This is necessary to ensure that the project config files are loaded and processed correctly.
  //  */
  // protected override async traverseFolder(
  //   workspaceFolder: WorkspaceFolder,
  //   folderPath: URI,
  //   fileExtensions: string[],
  //   collector: (document: LangiumDocument) => void,
  // ): Promise<void> {

  //   // Then load other files
  //   for (const entry of nonConfigFiles) {
  //     try {
  //       if (this.includeEntry(workspaceFolder, entry, fileExtensions)) {
  //         if (entry.isDirectory) {
  //           await this.traverseFolder(workspaceFolder, entry.uri, fileExtensions, collector)
  //         } else if (entry.isFile) {
  //           const document = await this.langiumDocuments.getOrCreateDocument(entry.uri)
  //           collector(document)
  //         }
  //       }
  //     } catch (error) {
  //       logError(error)
  //     }
  //   }
  // }

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
