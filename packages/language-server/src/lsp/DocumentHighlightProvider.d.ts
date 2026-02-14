import type { ReferenceDescription } from 'langium';
import { DefaultDocumentHighlightProvider } from 'langium/lsp';
import { DocumentHighlight } from 'vscode-languageserver';
export declare class LikeC4DocumentHighlightProvider extends DefaultDocumentHighlightProvider {
    /**
     * Override this method to determine the highlight kind of the given reference.
     */
    protected createDocumentHighlight(reference: ReferenceDescription): DocumentHighlight;
}
