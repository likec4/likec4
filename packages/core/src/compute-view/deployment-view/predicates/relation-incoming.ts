import { anyPass } from 'remeda'
import { invariant } from '../../../errors'
import { findConnectionsBetween } from '../../../model/connection/deployment'
import type { LikeC4DeploymentModel } from '../../../model/DeploymentModel'
import type { RelationshipModel } from '../../../model/RelationModel'
import type { AnyAux } from '../../../model/types'
import { FqnExpr, type RelationExpr } from '../../../types'
import { isAncestor } from '../../../utils/fqn'
import type { Connection, Elem, PredicateExecutor } from '../_types'
import { resolveElements, resolveModelElements } from '../utils'
import { excludeModelRelations, resolveAscendingSiblings } from './relation-direct'

// from visible element incoming to this
export const IncomingRelationPredicate: PredicateExecutor<RelationExpr.Incoming> = {
  include: ({ expr, model, memory, stage }) => {
    const sources = [...memory.elements]

    if (FqnExpr.isWildcard(expr.incoming)) {
      for (const source of sources) {
        if (source.allOutgoing.isEmpty) {
          continue
        }
        const targets = [...resolveAscendingSiblings(source)]
        stage.addConnections(findConnectionsBetween(source, targets, 'directed'))
      }
      return stage
    }
    invariant(FqnExpr.isDeploymentRef(expr.incoming), 'Only deployment refs are supported in include')

    const targets = resolveElements(model, expr.incoming)
    for (const source of sources) {
      stage.addConnections(findConnectionsBetween(source, targets, 'directed'))
    }

    return stage
  },
  exclude: ({ expr, model, memory, stage }) => {
    // Exclude all connections that have model relationshps with the elements
    if (FqnExpr.isModelRef(expr.incoming)) {
      const excludedRelations = resolveAllImcomingRelations(model, expr.incoming)
      return excludeModelRelations(excludedRelations, { stage, memory })
    }
    if (FqnExpr.isWildcard(expr.incoming)) {
      // non-sense
      return stage
    }

    const isIncoming = filterIncomingConnections(resolveElements(model, expr.incoming))
    const toExclude = memory.connections.filter(isIncoming)
    stage.excludeConnections(toExclude)
    return stage
  },
}

export function filterIncomingConnections(
  targets: Elem[],
): (connection: Connection) => boolean {
  return anyPass(
    targets.map(target => {
      const satisfies = (el: Elem) => el === target || isAncestor(target, el)
      return (connection: Connection) => {
        return !satisfies(connection.source) && satisfies(connection.target)
      }
    }),
  )
}
//   model: LikeC4DeploymentModel,
//   model: LikeC4DeploymentModel,
//   expr: FqnExpr.DeploymentRef
// ): (connection: Connection) => boolean {
//   if (FqnExpr.isWildcard(expr)) {
//     return () => true
//   }
//   if (isNullish(expr.selector)) {
//     // -> element
//     const target = model.element(expr.ref.deployment)
//     const isInside = (el: Elem) => el === target || isAncestor(target, el)
//     return (connection) => {
//       return !isInside(connection.source) && isInside(connection.target)
//     }
//   }

//   const isTarget = deploymentExpressionToPredicate(expr)
//   return (connection) => {
//     return isTarget(connection.target)
//   }
// }

export function resolveAllImcomingRelations(
  model: LikeC4DeploymentModel,
  moodelRef: FqnExpr.ModelRef,
): Set<RelationshipModel<AnyAux>> {
  const targets = resolveModelElements(model, moodelRef)
  return new Set(targets.flatMap(e => [...e.allIncoming]))
}
