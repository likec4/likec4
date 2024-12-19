import { anyPass } from 'remeda'
import { invariant } from '../../../errors'
import type { LikeC4DeploymentModel } from '../../../model'
import { findConnection, findConnectionsBetween } from '../../../model/connection/deployment'
import type { RelationshipModel } from '../../../model/RelationModel'
import { FqnExpr, type RelationExpr } from '../../../types'
import { isAncestor } from '../../../utils'
import type { Connection, Elem, PredicateExecutor } from '../_types'
import { resolveElements, resolveModelElements } from '../utils'
import { excludeModelRelations, resolveAscendingSiblings } from './relation-direct'

export const OutgoingRelationPredicate: PredicateExecutor<RelationExpr.Outgoing> = {
  include: ({ expr, model, memory, stage }) => {
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
      return stage
    }
    invariant(FqnExpr.isDeploymentRef(expr.outgoing), 'Only deployment refs are supported in include')

    const sources = resolveElements(model, expr.outgoing)
    for (const source of sources) {
      stage.addConnections(findConnectionsBetween(source, targets, 'directed'))
    }

    return stage
  },
  exclude: ({ expr, model, memory, stage }) => {
    // Exclude all connections that have model relationshps with the elements
    if (FqnExpr.isModelRef(expr.outgoing)) {
      const excludedRelations = resolveAllOutgoingRelations(model, expr.outgoing)
      return excludeModelRelations(excludedRelations, { stage, memory })
    }
    if (FqnExpr.isWildcard(expr.outgoing)) {
      // non-sense
      return stage
    }

    const isOutgoing = filterOutgoingConnections(resolveElements(model, expr.outgoing))
    const toExclude = memory.connections.filter(isOutgoing)
    stage.excludeConnections(toExclude)
    return stage
  },
}

export function filterOutgoingConnections(
  sources: Elem[],
): (connection: Connection) => boolean {
  return anyPass(
    sources.map(source => {
      const satisfies = (el: Elem) => el === source || isAncestor(source, el)
      return (connection: Connection) => {
        return satisfies(connection.source) && !satisfies(connection.target)
      }
    }),
  )
  // if (FqnExpr.isDeploymentRef(expr) && isNullish(expr.selector)) {
  //   // element ->
  //   const source = model.element(expr.ref.deployment)
  //   const isInside = (el: Elem) => el === source || isAncestor(source, el)
  //   return (connection: Connection) => {
  //     return isInside(connection.source) && !isInside(connection.target)
  //   }
  // } else {
  //   const isSource = deploymentExpressionToPredicate(expr)
  //   return (connection: Connection) => {
  //     return isSource(connection.source)
  //   }
  // }
}

export function resolveAllOutgoingRelations(
  model: LikeC4DeploymentModel,
  moodelRef: FqnExpr.ModelRef,
): Set<RelationshipModel> {
  const targets = resolveModelElements(model, moodelRef)
  return new Set(targets.flatMap(e => [...e.allOutgoing]))
}
