import { invariant } from '../../../errors'
import type { DeploymentConnectionModel } from '../../../model/connection/deployment'
import { findConnectionsBetween } from '../../../model/connection/deployment'
import type { LikeC4DeploymentModel } from '../../../model/DeploymentModel'
import type { RelationshipModel } from '../../../model/RelationModel'
import type { AnyAux } from '../../../model/types'
import { FqnExpr, type RelationExpr } from '../../../types'
import type { PredicateExecutor } from '../_types'
import { deploymentExpressionToPredicate, resolveElements, resolveModelElements } from '../utils'
import { excludeModelRelations, resolveAscendingSiblings } from './relation-direct'

// from visible element incoming to this
export const IncomingRelationPredicate: PredicateExecutor<RelationExpr.Incoming> = {
  include: ({ expr, model, memory, stage }) => {
    const sources = [...memory.elements]
    if (FqnExpr.isWildcard(expr.incoming)) {
      for (const source of sources) {
        if (source.allOutgoing.isEmpty) {
          continue
        }
        const targets = [...resolveAscendingSiblings(source)]
        stage.addConnections(findConnectionsBetween(source, targets, 'directed'))
      }
      return stage
    }
    invariant(FqnExpr.isDeploymentRef(expr.incoming), 'Only deployment refs are supported in include')

    const targets = resolveElements(model, expr.incoming)
    for (const source of sources) {
      stage.addConnections(findConnectionsBetween(source, targets, 'directed'))
    }

    return stage
  },
  exclude: ({ expr, model, memory, stage }) => {
    // Exclude all connections that have model relationshps with the elements
    if (FqnExpr.isModelRef(expr.incoming)) {
      const excludedRelations = resolveAllImcomingRelations(model, expr.incoming)
      return excludeModelRelations(excludedRelations, { stage, memory })
    }

    const isTarget = deploymentExpressionToPredicate(expr.incoming)

    const satisfies = (connection: DeploymentConnectionModel) => {
      return isTarget(connection.target)
    }

    const toExclude = memory.connections.filter(satisfies)

    stage.excludeConnections(toExclude)
    return stage
  }
}

export function resolveAllImcomingRelations(
  model: LikeC4DeploymentModel,
  moodelRef: FqnExpr.ModelRef
): Set<RelationshipModel<AnyAux>> {
  const targets = resolveModelElements(model, moodelRef)
  return new Set(targets.flatMap(e => [...e.allIncoming]))
}
