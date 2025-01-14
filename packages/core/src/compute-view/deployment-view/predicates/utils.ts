import { filter, isArray, map, pick, pipe } from 'remeda'
import { nonexhaustive } from '../../../errors'
import { type DeploymentConnectionModel, ElementModel, isDeployedInstance, isDeploymentNode } from '../../../model'
import type {
  DeploymentElementModel,
  DeploymentRelationEndpoint,
  DeploymentRelationModel,
} from '../../../model/DeploymentElementModel'
import { isElementModel } from '../../../model/ElementModel'
import { isDeploymentElementModel, isNestedElementOfDeployedInstanceModel } from '../../../model/guards'
import type { RelationshipModel } from '../../../model/RelationModel'
import type { AnyAux } from '../../../model/types'
import { type Filterable, type OperatorPredicate, FqnExpr, RelationExpr } from '../../../types'
import { hasIntersection, intersection } from '../../../utils/set'
import type { ExcludePredicateCtx, PredicateCtx } from '../_types'
import type { StageExclude, StageInclude } from '../memory'
import { DeploymentRefPredicate } from './elements'
import { DirectRelationPredicate } from './relation-direct'
import { InOutRelationPredicate } from './relation-in-out'
import { IncomingRelationPredicate } from './relation-incoming'
import { OutgoingRelationPredicate } from './relation-outgoing'
import { WhereRelationPredicate } from './relation-where'
import { WildcardPredicate } from './wildcard'

/**
 * Builds a patch object from an expression
 */
export function predicateToPatch(
  op: 'include' | 'exclude',
  { expr, where, ...ctx }: PredicateCtx,
): StageExclude | StageInclude | undefined {
  switch (true) {
    case FqnExpr.isModelRef(expr):
      // Ignore model refs in deployment view
      return undefined
    case FqnExpr.isDeploymentRef(expr):
      return DeploymentRefPredicate[op]({ ...ctx, expr, where } as any)
    case FqnExpr.isWildcard(expr):
      return WildcardPredicate[op]({ ...ctx, expr, where } as any)
    case RelationExpr.isDirect(expr):
      return DirectRelationPredicate[op]({ ...ctx, expr, where } as any)
    case RelationExpr.isInOut(expr):
      return InOutRelationPredicate[op]({ ...ctx, expr, where } as any)
    case RelationExpr.isOutgoing(expr):
      return OutgoingRelationPredicate[op]({ ...ctx, expr, where } as any)
    case RelationExpr.isIncoming(expr):
      return IncomingRelationPredicate[op]({ ...ctx, expr, where } as any)
    case RelationExpr.isWhere(expr):
      return WhereRelationPredicate[op]({ ...ctx, expr, where } as any)
    default:
      nonexhaustive(expr)
  }
}

export function excludeModelRelations(
  relationsToExclude: ReadonlySet<RelationshipModel<AnyAux>>,
  { stage, memory }: Pick<ExcludePredicateCtx, 'stage' | 'memory'>,
  where: OperatorPredicate<Filterable> | null,
  // Optional filter to scope the connections to exclude
  filterConnections: (c: DeploymentConnectionModel) => boolean = () => true,
): StageExclude {
  if (relationsToExclude.size === 0) {
    return stage
  }
  const toExclude = pipe(
    memory.connections,
    filter(c => filterConnections(c)),
    // Find connections that have at least one relation in common with the excluded relations
    filter(c => hasIntersection(c.relations.model, relationsToExclude)),
    map(c =>
      c.update({
        deployment: null,
        model: intersection(c.relations.model, relationsToExclude),
      })
    ),
    applyPredicate(where),
    filter(c => c.nonEmpty()),
  )
  if (toExclude.length === 0) {
    return stage
  }
  return stage.excludeConnections(toExclude)
}

export function matchConnection<M extends AnyAux>(
  c: DeploymentConnectionModel<M>,
  where: OperatorPredicate<Filterable> | null,
): boolean {
  return applyPredicate(c, where).nonEmpty()
}

/**
 * Filters relations of the provided connections using the provided predicate.
 * And copy of the connection with the filtered relations will be created.
 * Connections left without relations are removed from resulting collection.
 *
 * @param c The connection to apply the predicate to
 * @param where The predicate
 * @returns A copy of the connection with the filtered relations
 */
export function applyPredicate<M extends AnyAux>(
  c: readonly DeploymentConnectionModel<M>[],
  where: OperatorPredicate<Filterable> | null,
): readonly DeploymentConnectionModel<M>[]
/**
 * Filters relations of the connection using the provided predicate.
 *
 * @param c The connection to apply the predicate to
 * @param where The predicate
 * @returns A deep copy of the original collection with the filtered relations
 */
export function applyPredicate<M extends AnyAux>(
  c: DeploymentConnectionModel<M>,
  where: OperatorPredicate<Filterable> | null,
): DeploymentConnectionModel<M>
/**
 * Creates a function that filters relations of the provided connections using the provided predicate.
 * Connections left without relations are removed from resulting collection.
 *
 * @param c The connection to apply the predicate to
 * @param where The predicate
 * @returns A function to create a filtered copy of connections
 */
export function applyPredicate<M extends AnyAux>(
  where: OperatorPredicate<Filterable> | null,
): (data: readonly DeploymentConnectionModel<M>[]) => readonly DeploymentConnectionModel<M>[]
export function applyPredicate<M extends AnyAux>(
  ...args:
    | [readonly DeploymentConnectionModel<M>[], OperatorPredicate<Filterable> | null]
    | [OperatorPredicate<Filterable> | null]
    | [c: DeploymentConnectionModel<M>, OperatorPredicate<Filterable> | null]
):
  | DeploymentConnectionModel<M>
  | readonly DeploymentConnectionModel<M>[]
  | ((data: readonly DeploymentConnectionModel<M>[]) => readonly DeploymentConnectionModel<M>[])
{
  if (args.length === 1) {
    return x => applyPredicate(x, args[0])
  }

  const [c, where] = args
  if (where === null) {
    return c
  }

  if (isArray(c)) {
    return c
      .map(x => applyPredicate(x, where))
      .filter(x => x.nonEmpty())
  }

  return c.update({
    model: new Set([...c.relations.model.values()].filter(r => where(toFilterableRelation(c)(r)))),
    deployment: new Set([...c.relations.deployment.values()].filter(r => where(toFilterableRelation(c)(r)))),
  })
}

export function matchConnections<M extends AnyAux>(
  connections: readonly DeploymentConnectionModel<M>[],
  where: OperatorPredicate<Filterable> | null,
): readonly DeploymentConnectionModel[] {
  if (!where) {
    return connections
  }

  return pipe(
    connections,
    filter(c => matchConnection(c, where)),
  )
}

/**
 * Builds filterable presentation for relation endpoint. Enriches model properties with deployment properties when needed.
 * @param relationEndpoint Endpoint for which to build presentation
 * @param connectionEndpoint Endpoint of connection which was build from the relation.
 * @returns Presentation of the endpoint for usage in predicates
 */
function toFilterable<M extends AnyAux>(
  relationEndpoint: ElementModel<M> | DeploymentRelationEndpoint<M>,
  connectionEndpoint: DeploymentRelationEndpoint<M>,
): Filterable {
  if (isElementModel(relationEndpoint)) { // Element itself. Extend with tags of the deployed instance (TODO)
    const deployedInstance = isDeploymentElementModel(connectionEndpoint) && isDeployedInstance(connectionEndpoint)
      ? connectionEndpoint
      : null
    return {
      kind: relationEndpoint.kind,
      tags: [...relationEndpoint.tags, ...(deployedInstance?.tags ?? [])],
    }
  }
  if (isNestedElementOfDeployedInstanceModel(relationEndpoint)) { // Nested element. Has no own instance. No need to extend
    return pick(relationEndpoint.element, ['tags', 'kind'])
  }
  if (isDeployedInstance(relationEndpoint)) { // Deployed instance. Extend with tags of the model element
    return {
      kind: relationEndpoint.element.kind,
      tags: [...relationEndpoint.tags, ...relationEndpoint.element.tags],
    }
  }
  if (isDeploymentNode(relationEndpoint)) { // Deployment node. Has no representation in model. No need to extend
    return pick(relationEndpoint, ['tags', 'kind'])
  }

  nonexhaustive(relationEndpoint)
}

function toFilterableRelation<M extends AnyAux>(c: DeploymentConnectionModel<M>) {
  return (relation: RelationshipModel<M> | DeploymentRelationModel<M>) => ({
    tags: relation.tags,
    kind: relation.kind,
    source: toFilterable(relation.source, c.source),
    target: toFilterable(relation.target, c.target),
  })
}
