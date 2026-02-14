import { nonexhaustive } from '@likec4/core';
import { AstUtils, DefaultScopeProvider, EMPTY_SCOPE, EMPTY_STREAM, MapScope, stream, StreamScope, } from 'langium';
import { ast, isFqnRefInsideGlobals, isFqnRefInsideModel } from '../ast';
import { logWarnError } from '../logger';
import { projectIdFrom } from '../utils';
import { elementRef, readStrictFqn } from '../utils/elementRef';
const { getDocument } = AstUtils;
export class LikeC4ScopeProvider extends DefaultScopeProvider {
    deploymentsIndex;
    fqnIndex;
    indexManager;
    constructor(services) {
        super(services);
        this.indexManager = services.shared.workspace.IndexManager;
        this.fqnIndex = services.likec4.FqnIndex;
        this.deploymentsIndex = services.likec4.DeploymentsIndex;
    }
    getScope(context) {
        try {
            const projectId = projectIdFrom(context.container);
            const referenceType = this.reflection.getReferenceType(context);
            try {
                const container = context.container;
                if (ast.isFqnRef(container)) {
                    return new StreamScope(this.streamForFqnRef(projectId, container, context));
                }
                if (ast.isStrictFqnRef(container)) {
                    return this.getScopeForStrictFqnRef(projectId, container, context);
                }
                if (referenceType !== ast.Element) {
                    return this.getProjectScope(projectId, referenceType, context);
                }
                if (ast.isImported(container)) {
                    const projectId = projectIdFrom(container);
                    return new StreamScope(this.fqnIndex.rootElements(projectId));
                }
                if (ast.isStrictFqnElementRef(container) && context.property === 'el') {
                    const parent = container.parent;
                    if (!parent) {
                        return this.getProjectScope(projectId, referenceType, context);
                    }
                    return new StreamScope(this.fqnIndex.directChildrenOf(projectId, readStrictFqn(parent)));
                }
                return new StreamScope(stream(this.computeScope(projectId, context)));
            }
            catch (e) {
                logWarnError(e);
                return this.getProjectScope(projectId, referenceType, context);
            }
        }
        catch (e) {
            logWarnError(e);
            return EMPTY_SCOPE;
        }
    }
    // we need lazy resolving here
    *genUniqueDescedants(element) {
        if (!element) {
            return;
        }
        const projectId = projectIdFrom(element);
        if (ast.isElement(element)) {
            const fqn = this.fqnIndex.getFqn(element);
            yield* this.fqnIndex.uniqueDescedants(projectId, fqn);
            return;
        }
        if (ast.isDeploymentNode(element)) {
            const fqn = this.deploymentsIndex.getFqn(element);
            yield* this.deploymentsIndex.uniqueDescedants(projectId, fqn);
        }
    }
    *genScopeExtendElement({ element }) {
        if (element.el.$nodeDescription) {
            yield element.el.$nodeDescription;
            yield {
                ...element.el.$nodeDescription,
                name: 'this',
            };
            yield {
                ...element.el.$nodeDescription,
                name: 'it',
            };
        }
        // we make extended element resolvable inside ExtendElementBody
        yield* this.genUniqueDescedants(elementRef(element));
    }
    *genScopeElementView({ viewOf, extends: ext }) {
        if (viewOf) {
            // If we have "view of parent.target"
            // we make "target" resolvable inside ElementView
            if (viewOf.modelElement.value.$nodeDescription) {
                yield viewOf.modelElement.value.$nodeDescription;
            }
            yield* this.genUniqueDescedants(elementRef(viewOf));
            return;
        }
        if (ext) {
            const view = ext.view.ref;
            if (view) {
                yield* this.genScopeElementView(view);
            }
        }
    }
    getScopeForStrictFqnRef(projectId, container, context) {
        const parent = container.parent;
        if (!parent) {
            return this.getProjectScope(projectId, ast.DeploymentNode, context);
        }
        return new StreamScope(this.deploymentsIndex
            .directChildrenOf(projectId, readStrictFqn(parent))
            .filter(desc => this.reflection.isSubtype(desc.type, ast.DeploymentNode)));
    }
    *genScopeExtendDeployment({ deploymentNode }) {
        if (deploymentNode.value.$nodeDescription) {
            yield deploymentNode.value.$nodeDescription;
        }
        const target = deploymentNode.value.ref;
        if (target && ast.isDeploymentNode(target)) {
            yield* this.genUniqueDescedants(target);
        }
    }
    streamForFqnRef(projectId, container, context) {
        const parent = container.parent;
        if (!parent) {
            return stream(this.genScopeForParentlessFqnRef(projectId, container, context));
        }
        const parentRef = parent.value.ref;
        if (!parentRef) {
            return EMPTY_STREAM;
        }
        if (ast.isImported(parentRef)) {
            return stream(this.genUniqueDescedants(parentRef.imported.ref));
        }
        if (ast.isDeploymentNode(parentRef)) {
            return stream(this.genUniqueDescedants(parentRef));
        }
        if (ast.isDeployedInstance(parentRef)) {
            const target = parentRef.target.modelElement.value.ref;
            // dprint-ignore
            const resolvedTarget = ast.isImported(target)
                ? target.imported.ref
                : ast.isElement(target)
                    ? target
                    : undefined;
            return stream(this.genUniqueDescedants(resolvedTarget));
        }
        if (ast.isElement(parentRef)) {
            return stream(this.genUniqueDescedants(parentRef));
        }
        return nonexhaustive(parentRef);
    }
    *genScopeForParentlessFqnRef(projectId, container, context) {
        if (AstUtils.hasContainerOfType(container, ast.isElementRef) ||
            isFqnRefInsideModel(container)) {
            // Inside model scope we only need to resolve elements
            yield* this.computeScope(projectId, context, ast.Element);
        }
        else if (isFqnRefInsideGlobals(container)) {
            yield* this.computeScope(projectId, context, ast.Element);
            yield* this.computeScope(projectId, context, ast.DeploymentNode);
            yield* this.computeScope(projectId, context, ast.DeployedInstance);
        }
        else {
            // First preference for deployment nodes
            yield* this.computeScope(projectId, context, ast.DeploymentNode);
            // Second preference for deployed instances
            yield* this.computeScope(projectId, context, ast.DeployedInstance);
            // Third preference for elements if we are in deployment view
            if (AstUtils.hasContainerOfType(container, ast.isDeploymentViewBody)) {
                yield* this.computeScope(projectId, context, ast.Element);
            }
        }
        const doc = getDocument(container);
        const precomputed = doc.precomputedScopes;
        // Fourth preference for imported models
        if (precomputed) {
            yield* precomputed.values().filter(nd => this.reflection.isSubtype(nd.type, ast.Imported));
        }
    }
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
    *computeScope(projectId, context, referenceType = this.reflection.getReferenceType(context)) {
        const isElementReference = this.reflection.isSubtype(referenceType, ast.Element);
        const isDeploymentReference = this.reflection.isSubtype(referenceType, ast.DeploymentElement);
        const doc = getDocument(context.container);
        const precomputed = doc.precomputedScopes;
        if (!precomputed) {
            yield* this.getProjectScope(projectId, referenceType, context).getAllElements();
            return;
        }
        const byReferenceType = (desc) => this.reflection.isSubtype(desc.type, referenceType);
        let container = context.container;
        while (container) {
            const elements = precomputed.get(container).filter(byReferenceType);
            if (elements.length > 0) {
                yield* elements;
            }
            if (isDeploymentReference && ast.isExtendDeploymentBody(container)) {
                yield* this.genScopeExtendDeployment(container.$container);
            }
            if (isElementReference && ast.isExtendElementBody(container)) {
                yield* this.genScopeExtendElement(container.$container);
            }
            if (isElementReference && ast.isElementViewBody(container)) {
                yield* this.genScopeElementView(container.$container);
            }
            container = container.$container;
        }
        yield* this.getProjectScope(projectId, referenceType, context).getAllElements();
    }
    /**
     * Create a global scope filtered for the given reference type.
     */
    getProjectScope(projectId, referenceType, context) {
        if (referenceType === ast.LibIcon) {
            return super.getGlobalScope(referenceType, context);
        }
        return this.globalScopeCache.get(`${projectId}::${referenceType}`, () => new MapScope(this.indexManager.projectElements(projectId, referenceType)));
    }
    /**
     * Create a global scope filtered for the given reference type.
     */
    getGlobalScope(referenceType, context) {
        if (referenceType === ast.LibIcon) {
            return super.getGlobalScope(referenceType, context);
        }
        const projectId = projectIdFrom(context.container);
        return this.getProjectScope(projectId, referenceType, context);
    }
}
