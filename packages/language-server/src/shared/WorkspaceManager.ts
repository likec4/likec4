import { nonNullable } from '@likec4/core'
import type { LangiumDocument } from 'langium'
import { DefaultWorkspaceManager } from 'langium'
import type { WorkspaceFolder } from 'vscode-languageserver'

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
    return this.folders && this.folders.length > 0 ? nonNullable(this.folders[0]) : null
  }
}
