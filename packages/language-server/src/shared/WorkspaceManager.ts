import type { LangiumDocument, LangiumDocumentFactory, LangiumSharedServices } from 'langium'
import { DefaultWorkspaceManager } from 'langium'
import type { WorkspaceFolder } from 'vscode-languageserver-protocol'
import { URI } from 'vscode-uri'
import * as builtin from '../builtin'

export class LikeC4WorkspaceManager extends DefaultWorkspaceManager {
  protected readonly documentFactory: LangiumDocumentFactory

  constructor(services: LangiumSharedServices) {
    super(services)
    this.documentFactory = services.workspace.LangiumDocumentFactory
  }

  /**
   * Load all additional documents that shall be visible in the context of the given workspace
   * folders and add them to the collector. This can be used to include built-in libraries of
   * your language, which can be either loaded from provided files or constructed in memory.
   */
  protected override loadAdditionalDocuments(
    folders: WorkspaceFolder[],
    collector: (document: LangiumDocument) => void
  ): Promise<void> {
    collector(this.documentFactory.fromString(builtin.specification.document, URI.parse(builtin.specification.uri)))
    return Promise.resolve()
  }
}
