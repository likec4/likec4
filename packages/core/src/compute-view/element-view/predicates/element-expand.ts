import { findConnectionsWithin } from '../../../model/connection/model'
import type * as Expr from '../../../types/expression'
import type { ModelLayer } from '../../../types/expression-v2-model'
import type { Elem, PredicateExecutor } from '../_types'

export const ExpandedElementPredicate: PredicateExecutor<ModelLayer.FqnExpr.NonWildcard> = {
  include: ({ expr, model, stage, where }) => {
    const parent = model.element(expr.ref.model)
    if (where(parent)) {
      stage.addExplicit(parent)
      stage.connectWithExisting(parent)
    }

    const children = [...parent.children()].filter(where)
    const expanded = [] as Elem[]
    for (const child of children) {
      stage.addImplicit(child)
      if (stage.connectWithExisting(child)) {
        expanded.push(child)
      }
    }
    stage.addConnections(findConnectionsWithin(expanded))
    return stage
  },
  exclude: ({ expr, model, stage, where }) => {
    const parent = model.element(expr.ref.model)
    const elements = [
      parent,
      ...parent.children(),
    ].filter(where)
    stage.exclude(elements)
    return stage
  },
}
