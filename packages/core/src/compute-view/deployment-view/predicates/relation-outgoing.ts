import { filter, identity, map, pipe } from 'remeda'
import { invariant } from '../../../errors'
import { findConnection, findConnectionsBetween } from '../../../model/connection/deployment'
import type { DeploymentConnectionModel } from '../../../model/connection/deployment'
import type { RelationshipModel } from '../../../model/RelationModel'
import type { AnyAux } from '../../../model/types'
import { FqnExpr, type RelationExpr } from '../../../types'
import { hasIntersection, union } from '../../../utils/set'
import type { PredicateExecutor } from '../_types'
import { deploymentExpressionToPredicate, resolveElements, resolveModelElements } from '../utils'
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
    invariant(FqnExpr.isDeploymentRef(expr.outgoing), 'Only deployment refs are supported in include')

    const sources = resolveElements(model, expr.outgoing)
    for (const source of sources) {
      stage.addConnections(findConnectionsBetween(source, targets, 'directed'))
    }

    return stage.patch()
  },
  exclude: (expr, { model, memory, stage }) => {
    // Exclude all connections that have model relationshps with the elements
    if (FqnExpr.isModelRef(expr.outgoing)) {
      const sources = resolveModelElements(model, expr.outgoing)
      if (sources.length === 0) {
        return identity()
      }
      const excludedRelations = union(
        new Set<RelationshipModel<AnyAux>>(),
        ...sources.map(e => e.allOutgoing)
      )
      if (excludedRelations.size === 0) {
        return identity()
      }

      const toExclude = pipe(
        memory.connections,
        // Find connections that have at least one relation in common with the excluded relations
        filter(c => hasIntersection(c.relations.model, excludedRelations)),
        map(c =>
          c.clone({
            deployment: null,
            model: excludedRelations
          })
        )
      )

      if (toExclude.length === 0) {
        return identity()
      }

      stage.excludeConnections(toExclude)
      return stage.patch()
    }

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
