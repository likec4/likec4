import { DefaultDocumentHighlightProvider } from 'langium/lsp';
import { DocumentHighlight, DocumentHighlightKind } from 'vscode-languageserver';
export class LikeC4DocumentHighlightProvider extends DefaultDocumentHighlightProvider {
    /**
     * Override this method to determine the highlight kind of the given reference.
     */
    createDocumentHighlight(reference) {
        return DocumentHighlight.create(reference.segment.range, DocumentHighlightKind.Read);
    }
}
