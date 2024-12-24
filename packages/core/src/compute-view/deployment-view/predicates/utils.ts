import { nonexhaustive } from '../../../errors'
import {
  type ExpressionV2,
  type Filterable,
  type OperatorPredicate,
  FqnExpr,
  RelationExpr,
} from '../../../types'
import type { ExcludePredicateCtx, IncludePredicateCtx, PredicateCtx } from '../_types'
import type { StageExclude, StageInclude } from '../memory'
import { DeploymentRefPredicate } from './elements'
import { DirectRelationPredicate } from './relation-direct'
import { InOutRelationPredicate } from './relation-in-out'
import { IncomingRelationPredicate } from './relation-incoming'
import { OutgoingRelationPredicate } from './relation-outgoing'
import { WhereRelationPredicate } from './relation-where'
import { WildcardPredicate } from './wildcard'

/**
 * Builds a patch object from an expression
 */
// export function predicateToPatch(
//   op: 'include',
//   expr: ExpressionV2,
//   ctx: PredicateCtx,
//   where: OperatorPredicate<Filterable> | null
// ): StageInclude | undefined
// export function predicateToPatch(
//   op: 'exclude',
//   ctx: PredicateCtx
// ): StageExclude | undefined
export function predicateToPatch(
  op: 'include' | 'exclude',
  { expr, where, ...ctx }: PredicateCtx,
): StageExclude | StageInclude | undefined {
  switch (true) {
    case FqnExpr.isModelRef(expr):
      // Ignore model refs in deployment view
      return undefined
    case FqnExpr.isDeploymentRef(expr):
      return DeploymentRefPredicate[op]({ ...ctx, expr, where } as any)
    case FqnExpr.isWildcard(expr):
      return WildcardPredicate[op]({ ...ctx, expr, where } as any)
    case RelationExpr.isDirect(expr):
      return DirectRelationPredicate[op]({ ...ctx, expr, where } as any)
    case RelationExpr.isInOut(expr):
      return InOutRelationPredicate[op]({ ...ctx, expr, where } as any)
    case RelationExpr.isOutgoing(expr):
      return OutgoingRelationPredicate[op]({ ...ctx, expr, where } as any)
    case RelationExpr.isIncoming(expr):
      return IncomingRelationPredicate[op]({ ...ctx, expr, where } as any)
    case RelationExpr.isWhere(expr):
      return WhereRelationPredicate[op]({ ...ctx, expr, where } as any)
    default:
      nonexhaustive(expr)
  }
}
