import { identity } from 'remeda'
import { findConnection, findConnectionsBetween } from '../../../model/connection/deployment'
import type { DeploymentConnectionModel } from '../../../model/connection/deployment'
import { DeploymentElementExpression, type DeploymentRelationExpression } from '../../../types/deployments'
import type { PredicateExecutor } from '../_types'
import { deploymentExpressionToPredicate, resolveElements } from '../utils'
import { resolveAscendingSiblings } from './relation-direct'

export const OutgoingRelationPredicate: PredicateExecutor<DeploymentRelationExpression.Outgoing> = {
  include: (expr, { model, memory, stage }) => {
    const targets = [...memory.elements]

    // * -> (to visible elements)
    // outgoing from wildcard to visible element
    if (DeploymentElementExpression.isWildcard(expr.outgoing)) {
      for (const target of targets) {
        if (target.allIncoming.isEmpty) {
          continue
        }
        for (const source of resolveAscendingSiblings(target)) {
          stage.addConnections(findConnection(source, target, 'directed'))
        }
      }
      return stage.patch()
    }

    const sources = resolveElements(model, expr.outgoing)
    for (const source of sources) {
      stage.addConnections(findConnectionsBetween(source, targets, 'directed'))
    }

    return stage.patch()
  },
  exclude: (expr, { memory, stage }) => {
    const isSource = deploymentExpressionToPredicate(expr.outgoing)

    const satisfies = (connection: DeploymentConnectionModel) => {
      return isSource(connection.source)
    }

    const toExclude = memory.connections.filter(satisfies)
    if (toExclude.length === 0) {
      return identity()
    }

    stage.excludeConnections(toExclude)
    return stage.patch()
  }
}
