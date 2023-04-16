import type { LangiumDocument, LangiumDocumentFactory, LangiumSharedServices } from 'langium'
import { DefaultWorkspaceManager, WorkspaceManager } from 'langium'
import stripIndent from 'strip-indent'
import type { Hover, WorkspaceFolder } from 'vscode-languageserver-protocol'
import type { LikeC4Services } from '../module'
import type { LikeC4ModelLocator } from '../model'
import { ast } from '../ast'
import { URI } from 'vscode-uri'
import { logger } from '../logger'

export class LikeC4WorkspaceManager extends DefaultWorkspaceManager {
  protected readonly langiumDocumentFactory: LangiumDocumentFactory

  constructor(services: LangiumSharedServices) {
    super(services)
    this.langiumDocumentFactory = services.workspace.LangiumDocumentFactory
  }

  /**
   * Load all additional documents that shall be visible in the context of the given workspace
   * folders and add them to the collector. This can be used to include built-in libraries of
   * your language, which can be either loaded from provided files or constructed in memory.
   */
  protected override async loadAdditionalDocuments(
    _folders: WorkspaceFolder[],
    _collector: (document: LangiumDocument) => void
  ): Promise<void> {
    const doc = this.langiumDocumentFactory.fromString(
      `
    specification {
      element element
    }
  `,
      URI.parse('memory:///likec4-builtin.c4')
    )
    await this.documentBuilder.build([doc], { validationChecks: 'all' })
    this.langiumDocuments.addDocument(doc)
    return _collector(doc)
  }
}
