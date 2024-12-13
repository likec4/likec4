import { identity } from 'remeda'
import { invariant } from '../../../errors'
import { findConnection, findConnectionsBetween } from '../../../model/connection/deployment'
import type { DeploymentConnectionModel } from '../../../model/connection/deployment'
import { FqnExpr, type RelationExpr } from '../../../types'
import type { PredicateExecutor } from '../_types'
import { deploymentExpressionToPredicate, resolveElements } from '../utils'
import { resolveAscendingSiblings } from './relation-direct'

// from visible element incoming to this
export const IncomingRelationPredicate: PredicateExecutor<RelationExpr.Incoming> = {
  include: (expr, { model, memory, stage }) => {
    const sources = [...memory.elements]
    if (FqnExpr.isWildcard(expr.incoming)) {
      for (const source of sources) {
        if (source.allOutgoing.isEmpty) {
          continue
        }
        const targets = [...resolveAscendingSiblings(source)]
        stage.addConnections(findConnectionsBetween(source, targets, 'directed'))
      }
      return stage.patch()
    }
    invariant(FqnExpr.isDeploymentRef(expr.incoming), 'Expected DeploymentRef')

    const targets = resolveElements(model, expr.incoming)
    for (const source of sources) {
      stage.addConnections(findConnectionsBetween(source, targets, 'directed'))
    }

    return stage.patch()
  },
  exclude: (expr, { memory, stage }) => {
    const isTarget = deploymentExpressionToPredicate(expr.incoming)

    const satisfies = (connection: DeploymentConnectionModel) => {
      return isTarget(connection.target)
    }

    const toExclude = memory.connections.filter(satisfies)
    if (toExclude.length === 0) {
      return identity()
    }

    stage.excludeConnections(toExclude)
    return stage.patch()
  }
}
