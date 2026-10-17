import {
  type AstNode,
  type DiagnosticInfo,
  type LangiumDocument,
  type ValidationOptions,
  type ValidationSeverity,
  Cancellation,
  DefaultDocumentValidator,
} from 'langium'
import type { Diagnostic } from 'vscode-languageserver-types'
import type { LikeC4Services } from '../module'

export class LikeC4DocumentValidator extends DefaultDocumentValidator {
  constructor(protected services: LikeC4Services) {
    super(services)
  }

  /**
   * Langium does not keep the AST node in the diagnostic.
   * We attach it as non-enumerable property, so it is available for the parser
   * (see `checksFromDiagnostics`), but is not serialized when sent to the client.
   */
  protected override toDiagnostic<N extends AstNode>(
    severity: ValidationSeverity,
    message: string,
    info: DiagnosticInfo<N, string>,
  ): Diagnostic {
    const diagnostic = super.toDiagnostic(severity, message, info)
    if (info.node) {
      Object.defineProperty(diagnostic, 'node', {
        value: info.node,
        enumerable: false,
        writable: false,
        configurable: true,
      })
    }
    return diagnostic
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
