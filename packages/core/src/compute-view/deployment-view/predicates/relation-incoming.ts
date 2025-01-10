import { anyPass, filter, pipe } from 'remeda'
import { invariant } from '../../../errors'
import type { AnyAux, RelationshipModel } from '../../../model'
import { findConnectionsBetween } from '../../../model/connection/deployment'
import type { LikeC4DeploymentModel } from '../../../model/DeploymentModel'
import { type RelationExpr, FqnExpr } from '../../../types'
import { isAncestor } from '../../../utils'
import type { Connection, Elem, PredicateExecutor } from '../_types'
import { resolveElements, resolveModelElements } from '../utils'
import { resolveAscendingSiblings } from './relation-direct'
import { applyPredicate, excludeModelRelations } from './utils'

// from visible element incoming to this
export const IncomingRelationPredicate: PredicateExecutor<RelationExpr.Incoming> = {
  include: ({ expr, model, memory, stage, where }) => {
    const sources = [...memory.elements]

    if (FqnExpr.isWildcard(expr.incoming)) {
      for (const source of sources) {
        if (source.allOutgoing.isEmpty) {
          continue
        }
        const targets = [...resolveAscendingSiblings(source)]
        const toInclude = applyPredicate(findConnectionsBetween(source, targets, 'directed'), where)
        stage.addConnections(toInclude)
      }
      return stage
    }
    invariant(FqnExpr.isDeploymentRef(expr.incoming), 'Only deployment refs are supported in include')

    const targets = resolveElements(model, expr.incoming)
    for (const source of sources) {
      const toInclude = applyPredicate(findConnectionsBetween(source, targets, 'directed'), where)
      stage.addConnections(toInclude)
    }

    return stage
  },
  exclude: ({ expr, model, memory, stage, where }) => {
    // Exclude all connections that have model relationshps with the elements
    if (FqnExpr.isModelRef(expr.incoming)) {
      const excludedRelations = resolveAllImcomingRelations(model, expr.incoming)
      return excludeModelRelations(excludedRelations, { stage, memory }, where)
    }
    if (FqnExpr.isWildcard(expr.incoming)) {
      // non-sense
      return stage
    }

    const isIncoming = filterIncomingConnections(resolveElements(model, expr.incoming))
    const toExclude = pipe(
      memory.connections,
      filter(isIncoming),
      applyPredicate(where),
    )
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
