import { identity } from 'remeda'
import { invariant } from '../../../errors'
import { findConnection, findConnectionsBetween } from '../../../model/connection/deployment'
import type { DeploymentConnectionModel } from '../../../model/connection/deployment'
import { FqnExpr, type RelationExpr } from '../../../types'
import type { PredicateExecutor } from '../_types'
import { deploymentExpressionToPredicate, resolveElements } from '../utils'
import { resolveAscendingSiblings } from './relation-direct'

export const OutgoingRelationPredicate: PredicateExecutor<RelationExpr.Outgoing> = {
  include: (expr, { model, memory, stage }) => {
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
      return stage.patch()
    }
    invariant(FqnExpr.isDeploymentRef(expr.outgoing), 'Expected DeploymentRef')

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
