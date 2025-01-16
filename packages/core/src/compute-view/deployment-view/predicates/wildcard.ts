import { map, pipe } from 'remeda'
import { findConnectionsWithin } from '../../../model/connection/deployment'
import type { FqnExpr } from '../../../types'
import { type Elem, type PredicateExecutor } from '../_types'
import { applyElementPredicate } from './utils'

export const WildcardPredicate: PredicateExecutor<FqnExpr.Wildcard> = {
  include: ({ model, stage, where }) => {
    const children = [] as Elem[]

    const rootElements = pipe(
      [...model.roots()],
      applyElementPredicate(where),
      map(root => {
        if (!root.onlyOneInstance()) {
          children.push(...root.children())
        }
        return root
      }))

    stage.addExplicit(rootElements)
    if (children.length > 1) {
      stage.addConnections(findConnectionsWithin([
        ...rootElements,
        ...children,
      ]))
    }
    return stage
  },
  exclude: ({ stage, memory, where }) => {
    const elementsToExclude = pipe(
      [...memory.elements],
      applyElementPredicate(where),
    )

    stage.exclude(elementsToExclude)

    return stage
  },
}
