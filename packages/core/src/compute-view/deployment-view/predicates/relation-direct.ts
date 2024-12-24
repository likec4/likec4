import { filter, flatMap, isNonNullish, map, pick, pipe } from 'remeda'
import { invariant } from '../../../errors'
import type { LikeC4DeploymentModel } from '../../../model'
import type { DeploymentConnectionModel } from '../../../model/connection/deployment'
import { findConnection, findConnectionsBetween, findConnectionsWithin } from '../../../model/connection/deployment'
import { findConnectionsBetween as findModelConnectionsBetween } from '../../../model/connection/model'
import type { ConnectionModel } from '../../../model/connection/model/ConnectionModel'
import type { DeploymentElementModel, DeploymentRelationModel } from '../../../model/DeploymentElementModel'
import type { RelationshipModel } from '../../../model/RelationModel'
import type { AnyAux } from '../../../model/types'
import { type Filterable, type FqnRef, type OperatorPredicate, type RelationExpr, FqnExpr } from '../../../types'
import { hasIntersection, intersection } from '../../../utils/set'
import type { ExcludePredicateCtx, PredicateExecutor } from '../_types'
import type { StageExclude } from '../memory'
import { deploymentExpressionToPredicate, resolveElements, resolveModelElements } from '../utils'
import { filterIncomingConnections, resolveAllImcomingRelations } from './relation-incoming'
import { filterOutgoingConnections, resolveAllOutgoingRelations } from './relation-outgoing'

// const isRef = DeploymentElementExpression.isRef

export const resolveAscendingSiblings = (element: DeploymentElementModel) => {
  const siblings = new Set<DeploymentElementModel>()
  for (let sibling of element.descendingSiblings()) {
    // TODO: investigate if this is necessary
    // if (element.isInstance() && sibling.isDeploymentNode()) {
    //   // we flatten nodes that contain only one instance
    //   sibling = sibling.onlyOneInstance() ?? sibling
    // }
    siblings.add(sibling)
  }
  return siblings
}

const resolveWildcard = (model: LikeC4DeploymentModel, nonWildcard: FqnExpr.DeploymentRef) => {
  const sources = resolveElements(model, nonWildcard)
  return sources.map(source => {
    const targets = resolveAscendingSiblings(source)
    return [source, targets] as const
  })
}

export const DirectRelationPredicate: PredicateExecutor<RelationExpr.Direct> = {
  include: ({ expr: { source, target, isBidirectional = false }, model, stage, where }) => {
    invariant(!FqnExpr.isModelRef(source), 'Invalid source model ref in direct relation')
    invariant(!FqnExpr.isModelRef(target), 'Invalid target model ref in direct relation')
    const sourceIsWildcard = FqnExpr.isWildcard(source)
    const targetIsWildcard = FqnExpr.isWildcard(target)

    const dir = isBidirectional ? 'both' : 'directed'

    let connections

    switch (true) {
      // * -> *
      case sourceIsWildcard && targetIsWildcard: {
        connections = findConnectionsWithin(model.instances()).map(c => {
          stage.addImplicit(c.boundary)
          return c
        })
        break
      }

      // source -> *; source <-> *
      case !sourceIsWildcard && targetIsWildcard: {
        const sources = resolveElements(model, source)
        const isSource = filterOutgoingConnections(sources)

        let postFilter = isSource
        if (isBidirectional) {
          const isTarget = filterIncomingConnections(sources)
          postFilter = c => isSource(c) !== isTarget(c)
        }

        connections = sources
          .flatMap(source => {
            const targets = resolveAscendingSiblings(source)
            return findConnectionsBetween(source, targets, dir)
          })
          .filter(postFilter)
        break
      }
      // * -> target; * <-> target
      case sourceIsWildcard && !targetIsWildcard: {
        const targets = resolveElements(model, target)
        const isTarget = filterIncomingConnections(targets)

        let postFilter = isTarget
        if (isBidirectional) {
          const isSource = filterOutgoingConnections(targets)
          postFilter = c => isSource(c) !== isTarget(c)
        }

        connections = targets
          .flatMap(target => {
            const sources = resolveAscendingSiblings(target)
            return [...sources].flatMap(source => findConnection(source, target, dir))
          })
          .filter(postFilter)
        break
      }
      default: {
        invariant(!sourceIsWildcard, 'Inferrence failed - source should be a deployment ref')
        invariant(!targetIsWildcard, 'Inferrence failed - target should be a deployment ref')
        const sources = resolveElements(model, source)
        const targets = resolveElements(model, target)

        const isSource = filterOutgoingConnections(sources)
        const isTarget = filterIncomingConnections(targets)

        connections = pipe(
          sources,
          flatMap(s => matchConnections(findConnectionsBetween(s, targets, dir), where)),
          filter(c => isSource(c) && isTarget(c)),
        )
      }
    }

    stage.addConnections(connections)

    if (FqnExpr.isDeploymentRef(source) && isNonNullish(source.selector)) {
      stage.addImplicit(model.element(source.ref.deployment))
    }
    if (FqnExpr.isDeploymentRef(target) && isNonNullish(target.selector)) {
      stage.addImplicit(model.element(target.ref.deployment))
    }

    return stage
  },
  exclude: ({ expr, model, memory, stage, where }) => {
    const isTarget = deploymentExpressionToPredicate(expr.target)
    const isSource = deploymentExpressionToPredicate(expr.source)

    // * -> *
    // Exclude all connections
    if (
      FqnExpr.isWildcard(expr.source)
      && FqnExpr.isWildcard(expr.target)
    ) {
      stage.excludeConnections(matchConnections(memory.connections, where))
      return stage
    }

    if (FqnExpr.isModelRef(expr.source) && FqnExpr.isModelRef(expr.target)) {
      const toExclude = resolveRelationsBetweenModelElements({
        source: expr.source,
        target: expr.target,
        expr,
        model,
      })
      return excludeModelRelations(toExclude, { stage, memory }, c => matchConnection(c, where))
    }

    if (FqnExpr.isModelRef(expr.source)) {
      if (FqnExpr.isWildcard(expr.target)) {
        const toExclude = resolveAllOutgoingRelations(model, expr.source)
        return excludeModelRelations(toExclude, { stage, memory })
      }
      const allOutgoing = resolveAllOutgoingRelations(model, expr.source)
      return excludeModelRelations(
        allOutgoing,
        { stage, memory },
        c => isTarget(c.target) && matchConnection(c, where),
      )
    }

    if (FqnExpr.isModelRef(expr.target)) {
      const toExclude = resolveAllImcomingRelations(model, expr.target)
      return excludeModelRelations(
        toExclude,
        { stage, memory },
        c => isSource(c.source) && matchConnection(c, where),
      )
    }

    const satisfies = (connection: DeploymentConnectionModel) => {
      return ((isSource(connection.source) && isTarget(connection.target))
        || (expr.isBidirectional && isSource(connection.target) && isTarget(connection.source)))
        && matchConnection(connection, where)
    }

    const toExclude = memory.connections.filter(satisfies)

    stage.excludeConnections(toExclude)
    return stage
  },
}

export function excludeModelRelations(
  relationsToExclude: ReadonlySet<RelationshipModel<AnyAux>>,
  { stage, memory }: Pick<ExcludePredicateCtx, 'stage' | 'memory'>,
  // Optional filter to scope the connections to exclude
  filterConnections: (c: DeploymentConnectionModel) => boolean = () => true,
): StageExclude {
  if (relationsToExclude.size === 0) {
    return stage
  }
  const toExclude = pipe(
    memory.connections,
    // Find connections that have at least one relation in common with the excluded relations
    filter(c => filterConnections(c) && hasIntersection(c.relations.model, relationsToExclude)),
    map(c =>
      c.update({
        deployment: null,
        model: intersection(c.relations.model, relationsToExclude),
      })
    ),
  )
  if (toExclude.length === 0) {
    return stage
  }
  return stage.excludeConnections(toExclude)
}

function resolveRelationsBetweenModelElements({
  source,
  target,
  expr,
  model,
}: {
  source: FqnExpr.ModelRef
  target: FqnExpr.ModelRef
  expr: RelationExpr.Direct
  model: LikeC4DeploymentModel
}) {
  const sources = resolveModelElements(model, source)
  const targets = resolveModelElements(model, target)

  const dir = expr.isBidirectional ? 'both' : 'directed'

  const modelConnections = [] as ConnectionModel[]
  for (const source of sources) {
    modelConnections.push(...findModelConnectionsBetween(source, targets, dir))
  }

  return new Set(modelConnections.flatMap(c => [...c.relations]))
}

function elementToFilterable<M extends AnyAux>(element: DeploymentElementModel<M>) {
  return pick(element, ['tags', 'kind'])
}

function toFilterableRelation<M extends AnyAux>(
  source: DeploymentElementModel<M>,
  target: DeploymentElementModel<M>,
) {
  return (
    relation: RelationshipModel<M> | DeploymentRelationModel<M>,
  ) => ({
    tags: relation.tags,
    kind: relation.kind,
    source: elementToFilterable(source),
    target: elementToFilterable(target),
  })
}

function matchConnection<M extends AnyAux>(
  c: DeploymentConnectionModel<M>,
  where: OperatorPredicate<Filterable> | null,
): boolean {
  if (!where) {
    return true
  }

  return [
    ...Array.from(c.relations.deployment.values()).map(toFilterableRelation(c.source, c.target)),
    ...Array.from(c.relations.model.values()).map(toFilterableRelation(c.source, c.target)),
  ]
    .filter(where).length > 0
}

function matchConnections<M extends AnyAux>(
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
