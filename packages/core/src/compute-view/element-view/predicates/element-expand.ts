import { findConnectionsWithin } from '../../../model/connection/model'
import { type AnyAux, type ModelFqnExpr, FqnRef } from '../../../types'
import type { Elem, PredicateExecutor } from '../_types'
import { resolveElements } from './_utils'

export const ExpandedElementPredicate: PredicateExecutor<ModelFqnExpr.Ref<AnyAux>> = {
  include: ({ expr, model, stage, where }) => {
    const parent = model.element(FqnRef.flatten(expr.ref))
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
  exclude: ({ expr, model, stage, filterWhere }) => {
    const elements = filterWhere(resolveElements(model, expr))
    stage.exclude(elements)
    return stage
  },
}
