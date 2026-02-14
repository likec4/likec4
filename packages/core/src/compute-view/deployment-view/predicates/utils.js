import { filter, isArray, map, pick, pipe } from 'remeda';
import { isDeployedInstanceModel as isDeployedInstance, isDeploymentElementModel, isDeploymentNodeModel as isDeploymentNode, isElementModel, isNestedElementOfDeployedInstanceModel, } from '../../../model';
import { FqnExpr, RelationExpr } from '../../../types';
import { nonexhaustive } from '../../../utils';
import { hasIntersection, intersection } from '../../../utils/set';
import { DeploymentRefPredicate } from './deploymentRefs';
import { WhereDeploymentRefPredicate } from './deploymentRefs-where';
import { DirectRelationPredicate } from './relation-direct';
import { InOutRelationPredicate } from './relation-in-out';
import { IncomingRelationPredicate } from './relation-incoming';
import { OutgoingRelationPredicate } from './relation-outgoing';
import { WhereRelationPredicate } from './relation-where';
import { WildcardPredicate } from './wildcard';
/**
 * Builds a patch object from an expression
 */
export function predicateToPatch(op, { expr, where, ...ctx }) {
    switch (true) {
        case FqnExpr.isElementTagExpr(expr):
        case FqnExpr.isElementKindExpr(expr):
            throw new Error('element kind and tag expressions are not supported in deployment view rules');
        case RelationExpr.isCustom(expr):
        case FqnExpr.isCustom(expr):
        case FqnExpr.isModelRef(expr):
            // Ignore model refs in deployment view
            return undefined;
        case FqnExpr.isWhere(expr):
            return WhereDeploymentRefPredicate[op]({ ...ctx, expr, where });
        case RelationExpr.isWhere(expr):
            return WhereRelationPredicate[op]({ ...ctx, expr, where });
        case FqnExpr.isDeploymentRef(expr):
            return DeploymentRefPredicate[op]({ ...ctx, expr, where });
        case FqnExpr.isWildcard(expr):
            return WildcardPredicate[op]({ ...ctx, expr, where });
        case RelationExpr.isDirect(expr):
            return DirectRelationPredicate[op]({ ...ctx, expr, where });
        case RelationExpr.isInOut(expr):
            return InOutRelationPredicate[op]({ ...ctx, expr, where });
        case RelationExpr.isOutgoing(expr):
            return OutgoingRelationPredicate[op]({ ...ctx, expr, where });
        case RelationExpr.isIncoming(expr):
            return IncomingRelationPredicate[op]({ ...ctx, expr, where });
        default:
            nonexhaustive(expr);
    }
}
export function excludeModelRelations(relationsToExclude, { stage, memory }, where, 
// Optional filter to scope the connections to exclude
filterConnections = () => true) {
    if (relationsToExclude.size === 0) {
        return stage;
    }
    const toExclude = pipe(memory.connections, filter(c => filterConnections(c)), 
    // Find connections that have at least one relation in common with the excluded relations
    filter(c => hasIntersection(c.relations.model, relationsToExclude)), map(c => c.update({
        deployment: null,
        model: intersection(c.relations.model, relationsToExclude),
    })), applyPredicate(where), filter(c => c.nonEmpty()));
    if (toExclude.length === 0) {
        return stage;
    }
    return stage.excludeConnections(toExclude);
}
export function matchConnection(c, where) {
    return applyPredicate(c, where).nonEmpty();
}
export function applyPredicate(...args) {
    if (args.length === 1) {
        return x => applyPredicate(x, args[0]);
    }
    const [c, where] = args;
    if (where === null) {
        return c;
    }
    if (isArray(c)) {
        return c
            .map(x => applyPredicate(x, where))
            .filter(x => x.nonEmpty());
    }
    return c.update({
        model: new Set([...c.relations.model.values()].filter(r => where(toFilterableRelation(c)(r)))),
        deployment: new Set([...c.relations.deployment.values()].filter(r => where(toFilterableRelation(c)(r)))),
    });
}
export function applyElementPredicate(...args) {
    if (args.length === 1) {
        return x => applyElementPredicate(x, args[0]);
    }
    const [c, where] = args;
    if (isArray(c)) {
        return c.filter(x => applyElementPredicate(x, where));
    }
    return where?.(toFilterable(c, c)) ?? true;
}
export function matchConnections(connections, where) {
    if (!where) {
        return connections;
    }
    return pipe(connections, filter(c => matchConnection(c, where)));
}
/**
 * Builds filterable presentation for relation endpoint. Enriches model properties with deployment properties when needed.
 * @param relationEndpoint Endpoint for which to build presentation
 * @param connectionEndpoint Endpoint of connection which was build from the relation.
 * @returns Presentation of the endpoint for usage in predicates
 */
function toFilterable(relationEndpoint, connectionEndpoint) {
    if (isElementModel(relationEndpoint)) { // Element itself. Extend with tags of the deployed instance (TODO)
        const deployedInstance = isDeploymentElementModel(connectionEndpoint) && isDeployedInstance(connectionEndpoint)
            ? connectionEndpoint
            : null;
        return {
            kind: relationEndpoint.kind,
            tags: [...relationEndpoint.tags, ...(deployedInstance?.tags ?? [])],
        };
    }
    if (isNestedElementOfDeployedInstanceModel(relationEndpoint)) { // Nested element. Has no own instance. No need to extend
        return pick(relationEndpoint.element, ['tags', 'kind']);
    }
    if (isDeployedInstance(relationEndpoint)) { // Deployed instance. Extend with tags of the model element
        return {
            kind: relationEndpoint.element.kind,
            tags: [...relationEndpoint.tags, ...relationEndpoint.element.tags],
        };
    }
    if (isDeploymentNode(relationEndpoint)) { // Deployment node. Has no representation in model. No need to extend
        return pick(relationEndpoint, ['tags', 'kind']);
    }
    nonexhaustive(relationEndpoint);
}
function toFilterableRelation(c) {
    return (relation) => ({
        tags: relation.tags,
        kind: relation.kind,
        source: toFilterable(relation.source, c.source),
        target: toFilterable(relation.target, c.target),
    });
}
export function resolveAscendingSiblings(element) {
    const siblings = new Set();
    for (let sibling of element.descendingSiblings()) {
        // TODO: investigate if this is necessary
        // if (element.isInstance() && sibling.isDeploymentNode()) {
        //   // we flatten nodes that contain only one instance
        //   sibling = sibling.onlyOneInstance() ?? sibling
        // }
        siblings.add(sibling);
    }
    return siblings;
}
