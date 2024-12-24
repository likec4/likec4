import { filter, map, pick, pipe } from 'remeda'
import { nonexhaustive } from '../../../errors'
import type { RelationshipModel } from '../../../model/RelationModel'
import type { AnyAux } from '../../../model/types'
import { type Filterable, FqnExpr, type OperatorPredicate, RelationExpr } from '../../../types'
import type { ExcludePredicateCtx, PredicateCtx } from '../_types'
import { DeploymentRefPredicate } from './elements'
import { DirectRelationPredicate } from './relation-direct'
import { InOutRelationPredicate } from './relation-in-out'
import { IncomingRelationPredicate } from './relation-incoming'
import { OutgoingRelationPredicate } from './relation-outgoing'
import { WhereRelationPredicate } from './relation-where'
import { WildcardPredicate } from './wildcard'
import type { DeploymentElementModel, DeploymentRelationModel } from '../../../model/DeploymentElementModel'
import type { StageInclude, StageExclude } from '../memory'
import { hasIntersection, intersection } from '../../../utils/set'
import type { DeploymentConnectionModel } from '../../../model'

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
  filterConnections: (c: DeploymentConnectionModel) => boolean = () => true
): StageExclude {
  if (relationsToExclude.size === 0) {
    return stage
  }
  const toExclude = pipe(
    memory.connections,
    // Find connections that have at least one relation in common with the excluded relations
    filter(c => filterConnections(c) && hasIntersection(c.relations.model, relationsToExclude)),
    filter(c => matchConnection(c, where)),
    map(c =>
      c.update({
        deployment: null,
        model: intersection(c.relations.model, relationsToExclude),
      })
    )
  )
  if (toExclude.length === 0) {
    return stage
  }
  return stage.excludeConnections(toExclude)
}

function elementToFilterable<M extends AnyAux>(element: DeploymentElementModel<M>) {
  return pick(element, ['tags', 'kind'])
}

function toFilterableRelation<M extends AnyAux>(
  source: DeploymentElementModel<M>,
  target: DeploymentElementModel<M>
) {
  return (
    relation: RelationshipModel<M> | DeploymentRelationModel<M>
  ) => ({
    tags: relation.tags,
    kind: relation.kind,
    source: elementToFilterable(source),
    target: elementToFilterable(target)
  })
}

export function matchConnection<M extends AnyAux>(
  c: DeploymentConnectionModel<M>,
  where: OperatorPredicate<Filterable> | null
): boolean {
  if (!where) {
    return true
  }

  return [
    ...Array.from(c.relations.deployment.values()).map(toFilterableRelation(c.source, c.target)),
    ...Array.from(c.relations.model.values()).map(toFilterableRelation(c.source, c.target))
  ]
    .filter(where).length > 0
}

export function matchConnections<M extends AnyAux>(
  connections: readonly DeploymentConnectionModel<M>[],
  where: OperatorPredicate<Filterable> | null
): readonly DeploymentConnectionModel[] {
  if (!where) {
    return connections
  }

  return pipe(
    connections,
    filter(c => matchConnection(c, where))
  )
}