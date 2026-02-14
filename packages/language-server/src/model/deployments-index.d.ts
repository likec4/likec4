import { type LikeC4LangiumDocument, ast } from '../ast';
import type { LikeC4Services } from '../module';
import type { LikeC4NameProvider } from '../references';
import { DocumentFqnIndex, FqnIndex } from './fqn-index';
export declare class DeploymentsIndex extends FqnIndex<ast.DeploymentElement> {
    protected services: LikeC4Services;
    protected Names: LikeC4NameProvider;
    protected logger: any;
    constructor(services: LikeC4Services);
    protected createDocumentIndex(document: LikeC4LangiumDocument): DocumentFqnIndex;
}
