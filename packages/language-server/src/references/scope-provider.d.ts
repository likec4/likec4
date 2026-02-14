import { type ProjectId } from '@likec4/core';
import { type AstNodeDescription, type ReferenceInfo, type Scope, type Stream, DefaultScopeProvider } from 'langium';
import { ast } from '../ast';
import type { DeploymentsIndex, FqnIndex } from '../model';
import type { LikeC4Services } from '../module';
import type { IndexManager } from '../workspace';
export declare class LikeC4ScopeProvider extends DefaultScopeProvider {
    protected deploymentsIndex: DeploymentsIndex;
    protected fqnIndex: FqnIndex;
    protected readonly indexManager: IndexManager;
    constructor(services: LikeC4Services);
    getScope(context: ReferenceInfo): Scope;
    protected genUniqueDescedants(element: ast.Element | ast.DeploymentNode | undefined): Generator<any, void, any>;
    protected genScopeExtendElement({ element }: ast.ExtendElement): Generator<AstNodeDescription>;
    protected genScopeElementView({ viewOf, extends: ext }: ast.ElementView): Generator<AstNodeDescription>;
    protected getScopeForStrictFqnRef(projectId: ProjectId, container: ast.StrictFqnRef, context: ReferenceInfo): any;
    protected genScopeExtendDeployment({ deploymentNode }: ast.ExtendDeployment): Generator<AstNodeDescription>;
    protected streamForFqnRef(projectId: ProjectId, container: ast.FqnRef, context: ReferenceInfo): Stream<AstNodeDescription>;
    protected genScopeForParentlessFqnRef(projectId: ProjectId, container: ast.FqnRef, context: ReferenceInfo): Generator<AstNodeDescription>;
    /**
     * Computes the scope for a given reference context.
     *
     * @param context - The reference information containing the context for which the scope is being computed.
     * @param referenceType - The type of reference being resolved. Defaults to the reference type derived from the context.
     * @returns A scope containing the relevant AST node descriptions for the given reference context.
     *
     * This method first checks if there are precomputed scopes available in the document. If not, it falls back to the global scope.
     * It then iterates through the container hierarchy, collecting relevant scopes based on the reference type and container type.
     * Finally, it combines the collected scopes with the global scope to produce the final scope.
     */
    protected computeScope(projectId: ProjectId, context: ReferenceInfo, referenceType?: any): Generator<AstNodeDescription>;
    /**
     * Create a global scope filtered for the given reference type.
     */
    protected getProjectScope(projectId: ProjectId, referenceType: string, context: ReferenceInfo): Scope;
    /**
     * Create a global scope filtered for the given reference type.
     */
    protected getGlobalScope(referenceType: string, context: ReferenceInfo): Scope;
}
