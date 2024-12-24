import { filter, flatMap, isNonNullish, pick, pipe } from 'remeda'
import { invariant } from '../../../errors'
import type { ConnectionModel, DeploymentElementModel, DeploymentRelationModel, LikeC4DeploymentModel } from '../../../model'
import type { DeploymentConnectionModel } from '../../../model/connection/deployment'
import { findConnection, findConnectionsBetween, findConnectionsWithin } from '../../../model/connection/deployment'
import { findConnectionsBetween as findModelConnectionsBetween } from '../../../model/connection/model'
import type { RelationshipModel } from '../../../model/RelationModel'
import type { AnyAux } from '../../../model/types'
import { FqnExpr, type Filterable, type OperatorPredicate, type RelationExpr } from '../../../types'
import type { PredicateExecutor } from '../_types'
import { deploymentExpressionToPredicate, resolveElements, resolveModelElements } from '../utils'
import { filterIncomingConnections, resolveAllImcomingRelations } from './relation-incoming'
import { filterOutgoingConnections, resolveAllOutgoingRelations } from './relation-outgoing'
import { excludeModelRelations } from './utils'

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

    let modelRelationsToExclude: ReadonlySet<RelationshipModel<AnyAux>>
    switch (true) {
      // * -> *
      case FqnExpr.isWildcard(expr.source) && FqnExpr.isWildcard(expr.target):
        stage.excludeConnections(matchConnections(memory.connections, where))
        return stage

      // model -> model
      case FqnExpr.isModelRef(expr.source) && FqnExpr.isModelRef(expr.target):
        modelRelationsToExclude = resolveRelationsBetweenModelElements({
          source: expr.source,
          target: expr.target,
          expr,
          model
        })
        return excludeModelRelations(modelRelationsToExclude, { stage, memory }, where)

      // model -> *
      case FqnExpr.isModelRef(expr.source) && FqnExpr.isWildcard(expr.target):
        modelRelationsToExclude = resolveAllOutgoingRelations(model, expr.source)
        return excludeModelRelations(modelRelationsToExclude, { stage, memory }, where)

      // model -> deployment
      case FqnExpr.isModelRef(expr.source):
        modelRelationsToExclude = resolveAllOutgoingRelations(model, expr.source)
        return excludeModelRelations(
          modelRelationsToExclude,
          { stage, memory },
          where,
          c => isTarget(c.target)
        )

      // deployment -> model
      case FqnExpr.isModelRef(expr.target):
        modelRelationsToExclude = resolveAllImcomingRelations(model, expr.target)
        return excludeModelRelations(
          modelRelationsToExclude,
          { stage, memory },
          where,
          c => isSource(c.source)
        )

      // deployment -> deployment
      default:
        const satisfies = (connection: DeploymentConnectionModel) => {
          return (isSource(connection.source) && isTarget(connection.target))
            || (expr.isBidirectional === true && isSource(connection.target) && isTarget(connection.source))
        }

        const deploymentRelationsToExclude = pipe(
          memory.connections,
          filter(satisfies),
          filter(c => matchConnection(c, where))
        )
        if (deploymentRelationsToExclude.length === 0) {
          return stage
        }

        stage.excludeConnections(deploymentRelationsToExclude)
        return stage
    }
  }
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
