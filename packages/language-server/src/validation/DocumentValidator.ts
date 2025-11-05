import { type LangiumDocument, type ValidationOptions, Cancellation, DefaultDocumentValidator } from 'langium'
import type { Diagnostic } from 'vscode-languageserver-types'
import type { LikeC4Services } from '../module'

export class LikeC4DocumentValidator extends DefaultDocumentValidator {
  constructor(protected services: LikeC4Services) {
    super(services)
  }

  /**
   * If the document is excluded, then we skip validation and return an empty array of diagnostics.
   */
  override async validateDocument(
    document: LangiumDocument,
    options?: ValidationOptions,
    cancelToken?: Cancellation.CancellationToken,
  ): Promise<Diagnostic[]> {
    if (this.services.shared.workspace.ProjectsManager.isExcluded(document)) {
      return []
    }
    return await super.validateDocument(document, options, cancelToken)
  }
}
