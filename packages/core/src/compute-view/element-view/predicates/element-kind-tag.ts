import { findConnectionsWithin } from '../../../model/connection/model'
import * as Expr from '../../../types/expression'
import type { PredicateExecutor } from '../_types'
import { resolveElements } from './_utils'

export const ElementKindOrTagPredicate: PredicateExecutor<Expr.ElementKindExpr | Expr.ElementTagExpr> = {
  include: ({ expr, model, stage, filterWhere }) => {
    const elements = filterWhere(resolveElements(model, expr))
    if (elements.length === 0) {
      return
    }

    stage.addExplicit(elements)
    stage.connectWithExisting(elements)
    stage.addConnections(findConnectionsWithin(elements))

    return stage
  },

  exclude: ({ expr, model, stage, filterWhere }) => {
    const elements = filterWhere(resolveElements(model, expr))
    stage.exclude(elements)

    return stage
  }
}
