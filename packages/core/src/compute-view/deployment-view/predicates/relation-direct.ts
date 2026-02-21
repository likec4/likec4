import { filter, flatMap, isNonNullish, map, pipe } from 'remeda'
import type {
  DeploymentConnectionModel,
  LikeC4DeploymentModel,
  RelationshipModel,
} from '../../../model'
import {
  type ConnectionModel,
  findConnectionsBetween as findModelConnectionsBetween,
} from '../../../model/connection/model'
import type { AnyAux } from '../../../types'
import { type RelationExpr, FqnExpr } from '../../../types'
import { invariant } from '../../../utils'
import type { PredicateExecutor } from '../_types'
import {
  deploymentExpressionToPredicate,
  findConnection,
  findConnectionsBetween,
  findConnectionsWithin,
  resolveElements,
  resolveModelElements,
} from '../utils'
import { filterIncomingConnections, resolveAllIncomingRelations } from './relation-incoming'
import { filterOutgoingConnections, resolveAllOutgoingRelations } from './relation-outgoing'
import { applyPredicate, excludeModelRelations, resolveAscendingSiblings } from './utils'

// const resolveWildcard = (model: LikeC4DeploymentModel<AnyAux>, nonWildcard: FqnExpr.DeploymentRef) => {
//   const sources = resolveElements(model, nonWildcard)
//   return sources.map(source => {
//     const targets = resolveAscendingSiblings(source)
//     return [source, targets] as const
//   })
// }

export const DirectRelationPredicate: PredicateExecutor<RelationExpr.Direct> = {
  include: ({ expr: { source, target, isBidirectional = false }, model, stage, where }) => {
    if (FqnExpr.isElementTagExpr(source) || FqnExpr.isElementKindExpr(source)) {
      throw new Error('element kind and tag expressions are not supported in include')
    }
    if (FqnExpr.isElementTagExpr(target) || FqnExpr.isElementKindExpr(target)) {
      throw new Error('element kind and tag expressions are not supported in include')
    }
    invariant(!FqnExpr.isModelRef(source), 'Invalid source model ref in direct relation')
    invariant(!FqnExpr.isModelRef(target), 'Invalid target model ref in direct relation')
    const sourceIsWildcard = FqnExpr.isWildcard(source)
    const targetIsWildcard = FqnExpr.isWildcard(target)

    const dir = isBidirectional ? 'both' : 'directed'

    let connections

    switch (true) {
      // * -> *
      case sourceIsWildcard && targetIsWildcard: {
        connections = pipe(
          findConnectionsWithin(model.instances()),
          applyPredicate(where),
          map(c => {
            stage.addImplicit(c.boundary)
            return c
          }),
        )
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

        connections = pipe(
          sources,
          flatMap(source => {
            const targets = resolveAscendingSiblings(source)
            return findConnectionsBetween(source, targets, dir)
          }),
          filter(postFilter),
          applyPredicate(where),
        )
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

        connections = pipe(
          targets,
          flatMap(target => {
            const sources = resolveAscendingSiblings(target)
            return [...sources].flatMap(source => findConnection(source, target, dir))
          }),
          filter(postFilter),
          applyPredicate(where),
        )
        break
      }
      default: {
        invariant(!sourceIsWildcard, 'Inference failed - source should be a deployment ref')
        invariant(!targetIsWildcard, 'Inference failed - target should be a deployment ref')
        const sources = resolveElements(model, source)
        const targets = resolveElements(model, target)

        const isSource = filterOutgoingConnections(sources)
        const isTarget = filterIncomingConnections(targets)

        connections = pipe(
          sources,
          flatMap(s => findConnectionsBetween(s, targets, dir)),
          filter(c => isSource(c) && isTarget(c)),
          applyPredicate(where),
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
        stage.excludeConnections(applyPredicate(memory.connections, where))
        return stage

      // model -> model
      case FqnExpr.isModelRef(expr.source) && FqnExpr.isModelRef(expr.target):
        modelRelationsToExclude = resolveRelationsBetweenModelElements({
          source: expr.source,
          target: expr.target,
          expr,
          model,
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
          c => isTarget(c.target),
        )

      // deployment -> model
      case FqnExpr.isModelRef(expr.target):
        modelRelationsToExclude = resolveAllIncomingRelations(model, expr.target)
        return excludeModelRelations(
          modelRelationsToExclude,
          { stage, memory },
          where,
          c => isSource(c.source),
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
          applyPredicate(where),
        )
        if (deploymentRelationsToExclude.length === 0) {
          return stage
        }

        stage.excludeConnections(deploymentRelationsToExclude)
        return stage
    }
  },
}

function resolveRelationsBetweenModelElements<A extends AnyAux>({
  source,
  target,
  expr,
  model,
}: {
  source: FqnExpr.ModelRef<A>
  target: FqnExpr.ModelRef<A>
  expr: RelationExpr.Direct<A>
  model: LikeC4DeploymentModel<A>
}) {
  const sources = resolveModelElements(model, source)
  const targets = resolveModelElements(model, target)

  const dir = expr.isBidirectional ? 'both' : 'directed'

  const modelConnections = [] as ConnectionModel<A>[]
  for (const source of sources) {
    modelConnections.push(...findModelConnectionsBetween(source, targets, dir))
  }

  return new Set(modelConnections.flatMap(c => [...c.relations]))
}
