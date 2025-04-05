import { findConnectionsWithin } from '../../../model/connection/model'
import { ModelLayer } from '../../../types/expression-v2-model'
import type { Elem, PredicateExecutor } from '../_types'
import { resolveElements } from './_utils'

export const ExpandedElementPredicate: PredicateExecutor<ModelLayer.FqnExpr.ModelRef> = {
  include: ({ expr, model, stage, where }) => {
    const parent = model.element(ModelLayer.FqnRef.toFqn(expr.ref))
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
