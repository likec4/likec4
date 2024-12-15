import { findConnectionsWithin } from '../../../model/connection/model'
import type * as Expr from '../../../types/expression'
import type { Elem, PredicateExecutor } from '../_types'

export const ExpandedElementPredicate: PredicateExecutor<Expr.ExpandedElementExpr> = {
  include: ({ expr, model, stage, where }) => {
    const parent = model.element(expr.expanded)
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
    return stage.patch()
  },
  exclude: ({ expr, model, stage, where }) => {
    const parent = model.element(expr.expanded)
    const elements = [
      parent,
      ...parent.children()
    ].filter(where)
    return stage.exclude(elements).patch()
  }
}
