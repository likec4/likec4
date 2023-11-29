import { hasAtLeast, invariant } from '@likec4/core'
import type { LangiumDocument } from 'langium'
import { DefaultWorkspaceManager } from 'langium'
import type { WorkspaceFolder } from 'vscode-languageserver'
import { URI } from 'vscode-uri'

export class LikeC4WorkspaceManager extends DefaultWorkspaceManager {
  /**
   * Load all additional documents that shall be visible in the context of the given workspace
   * folders and add them to the collector. This can be used to include built-in libraries of
   * your language, which can be either loaded from provided files or constructed in memory.
   */
  protected override loadAdditionalDocuments(
    _folders: WorkspaceFolder[],
    _collector: (document: LangiumDocument) => void
  ): Promise<void> {
    // collector(this.documentFactory.fromString(builtin.specification.document, URI.parse(builtin.specification.uri)))
    return Promise.resolve()
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
