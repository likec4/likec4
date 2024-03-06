import type { ReferenceDescription } from 'langium'
import { DefaultDocumentHighlightProvider } from 'langium/lsp'
import { DocumentHighlight, DocumentHighlightKind } from 'vscode-languageserver'

export class LikeC4DocumentHighlightProvider extends DefaultDocumentHighlightProvider {
  /**
   * Override this method to determine the highlight kind of the given reference.
   */
  protected override createDocumentHighlight(reference: ReferenceDescription): DocumentHighlight {
    return DocumentHighlight.create(reference.segment.range, DocumentHighlightKind.Read)
  }
}
