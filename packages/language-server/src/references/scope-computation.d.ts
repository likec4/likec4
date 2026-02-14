import { type AstNodeDescription, type PrecomputedScopes, DefaultScopeComputation } from 'langium';
import type { CancellationToken } from 'vscode-languageserver';
import { type LikeC4LangiumDocument, ast } from '../ast';
import type { LikeC4Services } from '../module';
type ElementsContainer = ast.Model | ast.ElementBody | ast.ExtendElementBody;
type DeploymentsContainer = ast.ModelDeployments | ast.DeploymentNodeBody | ast.ExtendDeploymentBody | ast.DeployedInstanceBody;
export declare class LikeC4ScopeComputation extends DefaultScopeComputation {
    constructor(services: LikeC4Services);
    computeExports(document: LikeC4LangiumDocument, _cancelToken?: CancellationToken): Promise<AstNodeDescription[]>;
    private exportViews;
    private exportGlobals;
    private exportModel;
    private exportLibrary;
    private exportSpecification;
    private exportDeployments;
    computeLocalScopes(document: LikeC4LangiumDocument, _cancelToken?: CancellationToken): Promise<PrecomputedScopes>;
    protected processContainer(container: ElementsContainer, scopes: PrecomputedScopes, document: LikeC4LangiumDocument): AstNodeDescription[];
    protected processDeployments(container: DeploymentsContainer, scopes: PrecomputedScopes, document: LikeC4LangiumDocument): AstNodeDescription[];
}
export {};
