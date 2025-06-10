import type { AnyAux, ModelFqnExpr } from '../../../types'
import type { PredicateExecutor } from '../_types'
import { findConnectionsWithin, resolveElements } from './_utils'

export const ElementKindOrTagPredicate: PredicateExecutor<
  ModelFqnExpr.ElementKindExpr<AnyAux> | ModelFqnExpr.ElementTagExpr<AnyAux>
> = {
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
  },
}
