import { type MaybePromise, GrammarAST } from 'langium';
import { type CompletionAcceptor, type CompletionContext, type NextFeature, DefaultCompletionProvider } from 'langium/lsp';
import type { LikeC4Services } from '../module';
export declare class LikeC4CompletionProvider extends DefaultCompletionProvider {
    protected services: LikeC4Services;
    constructor(services: LikeC4Services);
    readonly completionOptions: CompletionProviderOptions;
    protected completionFor(context: CompletionContext, next: NextFeature, acceptor: CompletionAcceptor): MaybePromise<void>;
    protected completionForKeyword(context: CompletionContext, keyword: GrammarAST.Keyword, acceptor: CompletionAcceptor): MaybePromise<void>;
    protected completionForImportedProject(context: CompletionContext, acceptor: CompletionAcceptor): void;
}
