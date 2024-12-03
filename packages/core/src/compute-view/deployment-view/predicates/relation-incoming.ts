import { identity } from 'remeda'
import { findConnection, findConnectionsBetween } from '../../../model/connection/deployment'
import type { DeploymentConnectionModel } from '../../../model/DeploymentConnectionModel'
import { DeploymentElementExpression, type DeploymentRelationExpression } from '../../../types/deployments'
import { deploymentExpressionToPredicate } from '../../utils/deploymentExpressionToPredicate'
import type { PredicateExecutor } from '../_types'
import { resolveElements } from './relation-direct'

// from visible element incoming to this
export const IncomingRelationPredicate: PredicateExecutor<DeploymentRelationExpression.Incoming> = {
  include: (expr, { model, memory, stage }) => {
    const sources = [...memory.elements]
    if (DeploymentElementExpression.isWildcard(expr.incoming)) {
      for (const source of sources) {
        if (source.allOutgoing.isEmpty) {
          continue
        }
        for (const target of source.ascendingSiblings()) {
          stage.addConnections(findConnection(source, target, 'directed'))
          if (target.isDeploymentNode() && source.isInstance()) {
            for (const i of target.instances()) {
              stage.addConnections(findConnection(source, i, 'directed'))
            }
          }
        }
      }
      return stage.patch()
    }

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
