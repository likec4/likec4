import { findConnectionsWithin } from '../../../model/connection/model'
import { ModelLayer } from '../../../types/expression-model'
import type { Elem, PredicateExecutor } from '../_types'
import { resolveElements } from './_utils'

export const ElementRefPredicate: PredicateExecutor<ModelLayer.FqnExpr.ModelRef> = {
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
