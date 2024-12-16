import { findConnectionsWithin } from '../../../model/connection/model'
import type { ElementRefExpr } from '../../../types/expression'
import * as Expr from '../../../types/expression'
import type { Elem, PredicateExecutor } from '../_types'

function applyElementSelector(elem: Elem, expr: Expr.ElementRefExpr) {
  let children
  if (expr.isChildren) {
    children = [...elem.children()]
  } else if (expr.isDescendants) {
    children = [...elem.descendants()]
  }
  return children && children.length > 0 ? children : [elem]
}

export const ElementRefPredicate: PredicateExecutor<ElementRefExpr> = {
  include: ({ expr, model, stage, where }) => {
    const element = model.element(expr.element)
    const elements = applyElementSelector(element, expr).filter(where)
    if (elements.length === 0) {
      return
    }

    stage.addExplicit(elements)
    stage.connectWithExisting(elements)
    stage.addConnections(findConnectionsWithin(elements))
  },
  exclude: ({ expr, model, stage, filterWhere }) => {
    const element = model.element(expr.element)
    const elements = filterWhere(applyElementSelector(element, expr))
    stage.exclude(elements)
  }
}
