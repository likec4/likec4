import { invariant } from '../../../errors'
import type { LikeC4DeploymentModel } from '../../../model'
import type { DeploymentConnectionModel } from '../../../model/connection/deployment'
import { findConnection, findConnectionsBetween } from '../../../model/connection/deployment'
import type { RelationshipModel } from '../../../model/RelationModel'
import { FqnExpr, type RelationExpr } from '../../../types'
import type { PredicateExecutor } from '../_types'
import { deploymentExpressionToPredicate, resolveElements, resolveModelElements } from '../utils'
import { excludeModelRelations, resolveAscendingSiblings } from './relation-direct'

export const OutgoingRelationPredicate: PredicateExecutor<RelationExpr.Outgoing> = {
  include: ({ expr, model, memory, stage }) => {
    const targets = [...memory.elements]

    // * -> (to visible elements)
    // outgoing from wildcard to visible element
    if (FqnExpr.isWildcard(expr.outgoing)) {
      for (const target of targets) {
        if (target.allIncoming.isEmpty) {
          continue
        }
        for (const source of resolveAscendingSiblings(target)) {
          stage.addConnections(findConnection(source, target, 'directed'))
        }
      }
      return stage
    }
    invariant(FqnExpr.isDeploymentRef(expr.outgoing), 'Only deployment refs are supported in include')

    const sources = resolveElements(model, expr.outgoing)
    for (const source of sources) {
      stage.addConnections(findConnectionsBetween(source, targets, 'directed'))
    }

    return stage
  },
  exclude: ({ expr, model, memory, stage }) => {
    // Exclude all connections that have model relationshps with the elements
    if (FqnExpr.isModelRef(expr.outgoing)) {
      const excludedRelations = resolveAllOutgoingRelations(model, expr.outgoing)
      return excludeModelRelations(excludedRelations, { stage, memory })
    }

    const isSource = deploymentExpressionToPredicate(expr.outgoing)

    const satisfies = (connection: DeploymentConnectionModel) => {
      return isSource(connection.source)
    }

    const toExclude = memory.connections.filter(satisfies)
    if (toExclude.length === 0) {
      return
    }

    stage.excludeConnections(toExclude)
    return stage
  }
}

export function resolveAllOutgoingRelations(
  model: LikeC4DeploymentModel,
  moodelRef: FqnExpr.ModelRef
): Set<RelationshipModel> {
  const targets = resolveModelElements(model, moodelRef)
  return new Set(targets.flatMap(e => [...e.allOutgoing]))
}
