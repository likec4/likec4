import { identity } from 'remeda'
import type { DeploymentConnectionModel } from '../../../model/connection/deployment'
import { findConnectionsBetween } from '../../../model/connection/deployment'
import { DeploymentElementExpression, type DeploymentRelationExpression } from '../../../types/deployments'
import type { PredicateExecutor } from '../_types'
import { deploymentExpressionToPredicate, resolveElements } from '../utils'
import { resolveAscendingSiblings } from './relation-direct'

//
export const InOutRelationPredicate: PredicateExecutor<DeploymentRelationExpression.InOut> = {
  include: (expr, { model, memory, stage }) => {
    const sources = [...memory.elements]
    if (DeploymentElementExpression.isWildcard(expr.inout)) {
      for (const source of sources) {
        const targets = [...resolveAscendingSiblings(source)]
        stage.addConnections(findConnectionsBetween(source, targets, 'both'))
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
