import { invariant } from '../../../errors'
import { findConnectionsBetween } from '../../../model/connection/deployment'
import type { RelationshipModel } from '../../../model/RelationModel'
import type { AnyAux } from '../../../model/types'
import { FqnExpr, type RelationExpr } from '../../../types/expression-v2'
import { union } from '../../../utils/set'
import type { PredicateExecutor } from '../_types'
import { resolveElements, resolveModelElements } from '../utils'
import { excludeModelRelations, resolveAscendingSiblings } from './relation-direct'
import { filterIncomingConnections } from './relation-incoming'
import { filterOutgoingConnections } from './relation-outgoing'

//
export const InOutRelationPredicate: PredicateExecutor<RelationExpr.InOut> = {
  include: ({ expr, model, memory, stage }) => {
    const sources = [...memory.elements]

    if (FqnExpr.isWildcard(expr.inout)) {
      for (const source of sources) {
        const targets = [...resolveAscendingSiblings(source)]
        stage.addConnections(findConnectionsBetween(source, targets, 'both'))
      }
      return stage
    }
    invariant(FqnExpr.isDeploymentRef(expr.inout), 'Only deployment refs are supported in include')

    const targets = resolveElements(model, expr.inout)
    for (const source of sources) {
      stage.addConnections(findConnectionsBetween(source, targets, 'both'))
    }

    return stage
  },
  exclude: ({ expr, model, memory, stage }) => {
    // Exclude all connections that have model relationshps with the elements
    if (FqnExpr.isModelRef(expr.inout)) {
      const elements = resolveModelElements(model, expr.inout)
      if (elements.length === 0) {
        return stage
      }
      const excludedRelations = union(
        new Set<RelationshipModel<AnyAux>>(),
        ...elements.flatMap(e => [e.allIncoming, e.allOutgoing]),
      )
      return excludeModelRelations(excludedRelations, { stage, memory })
    }

    if (FqnExpr.isWildcard(expr.inout)) {
      // non-sense
      return stage
    }

    const elements = resolveElements(model, expr.inout)
    const isIncoming = filterIncomingConnections(elements)
    const isOutgoing = filterOutgoingConnections(elements)

    const toExclude = memory.connections.filter(c => isIncoming(c) !== isOutgoing(c))
    stage.excludeConnections(toExclude)
    return stage
  },
}
