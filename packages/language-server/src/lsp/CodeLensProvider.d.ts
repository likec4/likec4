import { type LangiumDocument } from 'langium';
import type { CodeLensProvider } from 'langium/lsp';
import type { CancellationToken, CodeLens, CodeLensParams } from 'vscode-languageserver';
import type { LikeC4Services } from '../module';
export declare class LikeC4CodeLensProvider implements CodeLensProvider {
    private services;
    constructor(services: LikeC4Services);
    provideCodeLens(doc: LangiumDocument, _params: CodeLensParams, cancelToken?: CancellationToken): Promise<CodeLens[] | undefined>;
}
