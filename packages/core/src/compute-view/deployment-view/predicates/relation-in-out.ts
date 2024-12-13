import { identity } from 'remeda'
import { invariant } from '../../../errors'
import type { DeploymentConnectionModel } from '../../../model/connection/deployment'
import { findConnectionsBetween } from '../../../model/connection/deployment'
import { FqnExpr, type RelationExpr } from '../../../types/expression-v2'
import type { PredicateExecutor } from '../_types'
import { deploymentExpressionToPredicate, resolveElements } from '../utils'
import { resolveAscendingSiblings } from './relation-direct'

//
export const InOutRelationPredicate: PredicateExecutor<RelationExpr.InOut> = {
  include: (expr, { model, memory, stage }) => {
    const sources = [...memory.elements]
    if (FqnExpr.isWildcard(expr.inout)) {
      for (const source of sources) {
        const targets = [...resolveAscendingSiblings(source)]
        stage.addConnections(findConnectionsBetween(source, targets, 'both'))
      }
      return stage.patch()
    }
    invariant(FqnExpr.isDeploymentRef(expr.inout), 'Expected DeploymentRef')

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
