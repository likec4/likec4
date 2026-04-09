import { type FqnExpr, whereOperatorAsPredicate } from '../../../types'
import { nonNullable } from '../../../utils'
import type { PredicateExecutor } from '../_types'
import { predicateToPatch } from './utils'

// relation matches the condition
export const WhereDeploymentRefPredicate: PredicateExecutor<FqnExpr.Where> = {
  include: ({ expr, model, memory, stage }) => {
    const where = whereOperatorAsPredicate(expr.where.condition)

    return nonNullable(predicateToPatch('include', {
      expr: expr.where.expr,
      model,
      stage,
      memory,
      where,
    }))
  },
  exclude: ({ expr, model, memory, stage }) => {
    const where = whereOperatorAsPredicate(expr.where.condition)

    return nonNullable(predicateToPatch('exclude', {
      expr: expr.where.expr,
      model,
      stage,
      memory,
      where,
    }))
  },
}
