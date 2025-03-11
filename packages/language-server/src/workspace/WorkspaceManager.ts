import { hasAtLeast, invariant } from '@likec4/core'
import type { LangiumDocument, LangiumDocumentFactory } from 'langium'
import { DefaultWorkspaceManager } from 'langium'
import type { WorkspaceFolder } from 'vscode-languageserver'
import { URI } from 'vscode-uri'
import * as BuiltIn from '../likec4lib'
import type { LikeC4SharedServices } from '../module'
import type { ProjectsManager } from '../workspace/ProjectsManager'

export class LikeC4WorkspaceManager extends DefaultWorkspaceManager {
  private documentFactory: LangiumDocumentFactory
  private projects: ProjectsManager

  constructor(services: LikeC4SharedServices) {
    super(services)
    this.documentFactory = services.workspace.LangiumDocumentFactory
    this.projects = services.workspace.ProjectsManager
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
   * We override the default implementation to process project config files during the traversal.
   * This is necessary to ensure that the project config files are loaded and processed correctly.
   */
  protected override async traverseFolder(
    workspaceFolder: WorkspaceFolder,
    folderPath: URI,
    fileExtensions: string[],
    collector: (document: LangiumDocument) => void,
  ): Promise<void> {
    const content = await this.fileSystemProvider.readDirectory(folderPath)
    await Promise.all(content.map(async entry => {
      if (await this.projects.loadConfigFile(entry)) {
        return // skip processing further for project config
      }
      if (this.includeEntry(workspaceFolder, entry, fileExtensions)) {
        if (entry.isDirectory) {
          await this.traverseFolder(workspaceFolder, entry.uri, fileExtensions, collector)
        } else if (entry.isFile) {
          const document = await this.langiumDocuments.getOrCreateDocument(entry.uri)
          collector(document)
        }
      }
    }))
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
