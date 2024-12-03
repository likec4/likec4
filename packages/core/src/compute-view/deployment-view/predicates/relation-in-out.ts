import { identity } from 'remeda'
import { findConnection, findConnectionsBetween } from '../../../model/connection/deployment'
import type { DeploymentConnectionModel } from '../../../model/connection/DeploymentConnectionModel'
import { DeploymentElementExpression, type DeploymentRelationExpression } from '../../../types/deployments'
import { deploymentExpressionToPredicate } from '../../utils/deploymentExpressionToPredicate'
import type { PredicateExecutor } from '../_types'
import { resolveElements } from './relation-direct'

//
export const InOutRelationPredicate: PredicateExecutor<DeploymentRelationExpression.InOut> = {
  include: (expr, { model, memory, stage }) => {
    const sources = [...memory.elements]
    if (DeploymentElementExpression.isWildcard(expr.inout)) {
      for (const source of sources) {
        if (source.allOutgoing.isEmpty) {
          continue
        }
        for (const target of source.ascendingSiblings()) {
          stage.addConnections(findConnection(source, target, 'both'))
          if (target.isDeploymentNode() && source.isInstance()) {
            for (const i of target.instances()) {
              stage.addConnections(findConnection(source, i, 'both'))
            }
          }
        }
      }
      return stage.patch()
    }

    const targets = resolveElements(model, expr.inout)
    for (const source of sources) {
      stage.addConnections(findConnectionsBetween(source, targets, 'both'))
    }

    return stage.patch()
  },
  exclude: (expr, { memory, stage }) => {
    const isSourceOrTarget = deploymentExpressionToPredicate(expr.inout)

    const satisfies = (connection: DeploymentConnectionModel) => {
      return isSourceOrTarget(connection.source) || isSourceOrTarget(connection.target)
    }

    const toExclude = memory.connections.filter(satisfies)
    if (toExclude.length === 0) {
      return identity()
    }

    stage.excludeConnections(toExclude)
    return stage.patch()
  }
}
