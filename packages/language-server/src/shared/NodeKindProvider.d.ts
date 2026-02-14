import { type AstNode, type AstNodeDescription } from 'langium';
import type { LangiumSharedServices, NodeKindProvider as LspNodeKindProvider } from 'langium/lsp';
import { CompletionItemKind, SymbolKind } from 'vscode-languageserver-types';
export declare class NodeKindProvider implements LspNodeKindProvider {
    private services;
    constructor(services: LangiumSharedServices);
    /**
     * Returns a `SymbolKind` as used by `WorkspaceSymbolProvider` or `DocumentSymbolProvider`.
     */
    getSymbolKind(node: AstNode | AstNodeDescription): SymbolKind;
    /**
     * Returns a `CompletionItemKind` as used by the `CompletionProvider`.
     */
    getCompletionItemKind(node: AstNode | AstNodeDescription): CompletionItemKind;
}
