import { filter, pipe } from 'remeda'
import type { RelationshipModel } from '../../../model'
import { type RelationExpr, FqnExpr } from '../../../types'
import { invariant } from '../../../utils'
import { union } from '../../../utils/set'
import type { PredicateExecutor } from '../_types'
import { findConnectionsBetween, resolveElements, resolveModelElements } from '../utils'
import { filterIncomingConnections } from './relation-incoming'
import { filterOutgoingConnections } from './relation-outgoing'
import { applyPredicate, excludeModelRelations, matchConnections, resolveAscendingSiblings } from './utils'

//
export const InOutRelationPredicate: PredicateExecutor<RelationExpr.InOut> = {
  include: ({ expr, model, memory, stage, where }) => {
    const sources = [...memory.elements]

    if (FqnExpr.isWildcard(expr.inout)) {
      for (const source of sources) {
        const targets = [...resolveAscendingSiblings(source)]
        const toInclude = matchConnections(findConnectionsBetween(source, targets, 'both'), where)
        stage.addConnections(toInclude)
      }
      return stage
    }
    invariant(FqnExpr.isDeploymentRef(expr.inout), 'Only deployment refs are supported in include')

    const targets = resolveElements(model, expr.inout)
    for (const source of sources) {
      const toInclude = matchConnections(findConnectionsBetween(source, targets, 'both'), where)
      stage.addConnections(toInclude)
    }

    return stage
  },
  exclude: ({ expr, model, memory, stage, where }) => {
    if (FqnExpr.isElementTagExpr(expr.inout) || FqnExpr.isElementKindExpr(expr.inout)) {
      throw new Error('element kind and tag expressions are not supported in exclude')
    }
    // Exclude all connections that have model relationshps with the elements
    if (FqnExpr.isModelRef(expr.inout)) {
      const elements = resolveModelElements(model, expr.inout)
      if (elements.length === 0) {
        return stage
      }
      const excludedRelations = union(
        new Set<RelationshipModel>(),
        ...elements.flatMap(e => [e.allIncoming, e.allOutgoing]),
      )
      return excludeModelRelations(excludedRelations, { stage, memory }, where)
    }

    if (FqnExpr.isWildcard(expr.inout)) {
      // non-sense
      return stage
    }

    const elements = resolveElements(model, expr.inout)
    const isIncoming = filterIncomingConnections(elements)
    const isOutgoing = filterOutgoingConnections(elements)

    const toExclude = pipe(
      memory.connections,
      filter(c => isIncoming(c) !== isOutgoing(c)),
      applyPredicate(where),
    )
    stage.excludeConnections(toExclude)
    return stage
  },
}
