import { type AstNode, type LangiumDocument } from 'langium';
import { type SemanticTokenAcceptor, AbstractSemanticTokenProvider } from 'langium/lsp';
import { type SemanticTokensDeltaParams, type SemanticTokensParams, type SemanticTokensRangeParams, CancellationToken } from 'vscode-languageserver-protocol';
import { type SemanticTokens, type SemanticTokensDelta } from 'vscode-languageserver-types';
import type { LikeC4Services } from '../module';
export declare class LikeC4SemanticTokenProvider extends AbstractSemanticTokenProvider {
    protected services: LikeC4Services;
    private rules;
    constructor(services: LikeC4Services);
    protected initRules(): void;
    semanticHighlight(document: LangiumDocument, params: SemanticTokensParams, cancelToken?: any): Promise<SemanticTokens>;
    semanticHighlightRange(document: LangiumDocument, params: SemanticTokensRangeParams, cancelToken?: any): Promise<SemanticTokens>;
    semanticHighlightDelta(document: LangiumDocument, params: SemanticTokensDeltaParams, cancelToken?: any): Promise<SemanticTokens | SemanticTokensDelta>;
    protected ensureState(document: LangiumDocument, cancelToken: CancellationToken): Promise<void>;
    protected highlightElement(node: AstNode, acceptor: SemanticTokenAcceptor): void | undefined | 'prune';
    private highlightNameAndKind;
    private highlightView;
    private mark;
}
