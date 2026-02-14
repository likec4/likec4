import { type LangiumDocument, type ValidationOptions, Cancellation, DefaultDocumentValidator } from 'langium';
import type { Diagnostic } from 'vscode-languageserver-types';
import type { LikeC4Services } from '../module';
export declare class LikeC4DocumentValidator extends DefaultDocumentValidator {
    protected services: LikeC4Services;
    constructor(services: LikeC4Services);
    /**
     * If the document is excluded, then we skip validation and return an empty array of diagnostics.
     */
    validateDocument(document: LangiumDocument, options?: ValidationOptions, cancelToken?: Cancellation.CancellationToken): Promise<Diagnostic[]>;
}
