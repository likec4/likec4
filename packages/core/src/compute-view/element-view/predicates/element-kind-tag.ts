import { findConnectionsWithin } from '../../../model/connection/model'
import type { ModelLayer } from '../../../types/expression-v2-model'
import type { PredicateExecutor } from '../_types'
import { resolveElements } from './_utils'

export const ElementKindOrTagPredicate: PredicateExecutor<
  ModelLayer.FqnExpr.ElementKindExpr | ModelLayer.FqnExpr.ElementTagExpr
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
