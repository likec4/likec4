import { type AstNode, type MaybePromise } from 'langium';
import { AstNodeHoverProvider } from 'langium/lsp';
import type { Hover } from 'vscode-languageserver-types';
import type { LikeC4Services } from '../module';
export declare class LikeC4HoverProvider extends AstNodeHoverProvider {
    private parser;
    private locator;
    constructor(services: LikeC4Services);
    protected getAstNodeHoverContent(node: AstNode): MaybePromise<Hover | undefined>;
}
