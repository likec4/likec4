import { findConnectionsWithin } from '../../../model/connection/deployment'
import type { FqnExpr } from '../../../types'
import { type Elem, type PredicateExecutor } from '../_types'

export const WildcardPredicate: PredicateExecutor<FqnExpr.Wildcard> = {
  include: ({ model, stage }) => {
    const children = [] as Elem[]

    const rootElements = [...model.roots()].map(root => {
      if (!root.onlyOneInstance()) {
        children.push(...root.children())
      }
      return root
    })

    stage.addExplicit(rootElements)
    if (children.length > 1) {
      stage.addConnections(findConnectionsWithin([
        ...rootElements,
        ...children,
      ]))
    }
    return stage
  },
  exclude: ({ stage, memory }) => {
    stage.exclude(memory.elements)
    return stage
  },
}
