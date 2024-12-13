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
    invariant(FqnExpr.isDeploymentRef(expr.incoming), 'Only deployment refs are supported in include')

    const targets = resolveElements(model, expr.incoming)
    for (const source of sources) {
      stage.addConnections(findConnectionsBetween(source, targets, 'directed'))
    }

    return stage.patch()
  },
  exclude: (expr, { model, memory, stage }) => {
    // Exclude all connections that have model relationshps with the elements
    if (FqnExpr.isModelRef(expr.incoming)) {
      const targets = resolveModelElements(model, expr.incoming)
      if (targets.length === 0) {
        return identity()
      }
      const excludedRelations = union(
        new Set<RelationshipModel<AnyAux>>(),
        ...targets.map(e => e.allIncoming)
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
