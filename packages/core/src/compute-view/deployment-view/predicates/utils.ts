import { filter, isArray, map, pick, pipe } from 'remeda'
import { nonexhaustive } from '../../../errors'
import type { DeploymentElementModel, DeploymentRelationModel } from '../../../model/DeploymentElementModel'
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
    filter(c => c.nonEmpty())
  )
  if (toExclude.length === 0) {
    return stage
  }
  return stage.excludeConnections(toExclude)
}

export function matchConnection<M extends AnyAux>(
  c: DeploymentConnectionModel<M>,
  where: OperatorPredicate<Filterable> | null
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
  where: OperatorPredicate<Filterable> | null): readonly DeploymentConnectionModel<M>[]
/**
 * Filters relations of the connection using the provided predicate.
 * 
 * @param c The connection to apply the predicate to
 * @param where The predicate
 * @returns A deep copy of the original collection with the filtered relations 
 */
export function applyPredicate<M extends AnyAux>(
  c: DeploymentConnectionModel<M>,
  where: OperatorPredicate<Filterable> | null
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
  where: OperatorPredicate<Filterable> | null
): ((data: readonly DeploymentConnectionModel<M>[]) => readonly DeploymentConnectionModel<M>[])
export function applyPredicate<M extends AnyAux>(
  ...args: 
  | [readonly DeploymentConnectionModel<M>[], OperatorPredicate<Filterable> | null] 
  | [OperatorPredicate<Filterable> | null]
  | [c: DeploymentConnectionModel<M>, OperatorPredicate<Filterable> | null]
): 
  | DeploymentConnectionModel<M> 
  | readonly DeploymentConnectionModel<M>[] 
  | ((data: readonly DeploymentConnectionModel<M>[]) => readonly DeploymentConnectionModel<M>[]) {
  if(args.length === 1) {
    return x => applyPredicate(x, args[0])
  }

  const [c, where] = args
  if (where === null) {
    return c
  }

  if(isArray(c)) {
    return c
      .map(x => applyPredicate(x, where))
      .filter(x => x.nonEmpty())
  }
  
  const map = toFilterableRelation(c.source, c.target)
  return c.update({
    model: new Set([...c.relations.model.values()].filter(r => where(map(r)))),
    deployment: new Set([...c.relations.deployment.values()].filter(r => where(map(r))))
  })
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
