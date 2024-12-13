import { filter, identity, map, pipe } from 'remeda'
import { invariant } from '../../../errors'
import { DeploymentConnectionModel } from '../../../model/connection/deployment'
import { findConnectionsBetween } from '../../../model/connection/deployment'
import type { RelationshipModel } from '../../../model/RelationModel'
import type { AnyAux } from '../../../model/types'
import { FqnExpr, type RelationExpr } from '../../../types/expression-v2'
import { hasIntersection, union } from '../../../utils/set'
import type { PredicateExecutor } from '../_types'
import { deploymentExpressionToPredicate, resolveElements, resolveModelElements } from '../utils'
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
    invariant(FqnExpr.isDeploymentRef(expr.inout), 'Only deployment refs are supported in include')

    const targets = resolveElements(model, expr.inout)
    for (const source of sources) {
      stage.addConnections(findConnectionsBetween(source, targets, 'both'))
    }

    return stage.patch()
  },
  exclude: (expr, { model, memory, stage }) => {
    // Exclude all connections that have model relationshps with the elements
    if (FqnExpr.isModelRef(expr.inout)) {
      const elements = resolveModelElements(model, expr.inout)
      if (elements.length === 0) {
        return identity()
      }
      const excludedRelations = union(
        new Set<RelationshipModel<AnyAux>>(),
        ...elements.flatMap(e => [e.allIncoming, e.allOutgoing])
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
