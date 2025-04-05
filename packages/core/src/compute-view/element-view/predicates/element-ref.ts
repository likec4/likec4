import { findConnectionsWithin } from '../../../model/connection/model'
import { ModelLayer } from '../../../types/expression-v2-model'
import type { Elem, PredicateExecutor } from '../_types'
import { resolveElements } from './_utils'

function applyElementSelector(elem: Elem, expr: ModelLayer.FqnExpr.ModelRef) {
  let children
  if (expr.selector === 'children') {
    children = [...elem.children()]
  } else if (expr.selector === 'descendants') {
    children = [...elem.descendants()]
  }
  return children && children.length > 0 ? children : [elem]
}

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
