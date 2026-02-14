import type { LangiumDocument } from 'langium';
import type { DocumentLinkProvider } from 'langium/lsp';
import type { CancellationToken, DocumentLink, DocumentLinkParams } from 'vscode-languageserver';
import type { LikeC4Services } from '../module';
export declare class LikeC4DocumentLinkProvider implements DocumentLinkProvider {
    private services;
    constructor(services: LikeC4Services);
    getDocumentLinks(doc: LangiumDocument, _params: DocumentLinkParams, _cancelToken?: CancellationToken): Promise<DocumentLink[]>;
    resolveLink(doc: LangiumDocument, link: string): string;
    relativeLink(doc: LangiumDocument, link: string): string | null;
}
