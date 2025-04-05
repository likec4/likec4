import { type FqnExpr, type RelationExpr, whereOperatorAsPredicate } from '../../../types'
import type { PredicateExecutor } from '../_types'
import type { StageExclude, StageInclude } from '../memory'
import { predicateToPatch } from './utils'

// relation matches the condition
export const WhereDeploymentRefPredicate: PredicateExecutor<FqnExpr.Where> = {
  include: ({ expr, model, memory, stage }) => {
    const where = whereOperatorAsPredicate(expr.where.condition)

    return predicateToPatch('include', { expr: expr.where.expr, model, stage, memory, where }) as StageInclude
  },
  exclude: ({ expr, model, memory, stage }) => {
    const where = whereOperatorAsPredicate(expr.where.condition)

    return predicateToPatch('exclude', { expr: expr.where.expr, model, stage, memory, where }) as StageExclude
  },
}
