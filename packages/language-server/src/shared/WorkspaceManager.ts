import { hasAtLeast, invariant } from '@likec4/core'
import type { LangiumDocument, LangiumDocumentFactory } from 'langium'
import { DefaultWorkspaceManager } from 'langium'
import type { LangiumSharedServices } from 'langium/lsp'
import type { WorkspaceFolder } from 'vscode-languageserver'
import { URI } from 'vscode-uri'
import { LibIcons } from '../generated-lib/icons'
import * as BuiltIn from '../likec4lib'

export class LikeC4WorkspaceManager extends DefaultWorkspaceManager {
  private documentFactory: LangiumDocumentFactory

  constructor(services: LangiumSharedServices) {
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
    collector: (document: LangiumDocument) => void
  ): Promise<void> {
    collector(this.documentFactory.fromString(LibIcons, URI.parse(BuiltIn.Uri)))
    await super.loadAdditionalDocuments(folders, collector)
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
