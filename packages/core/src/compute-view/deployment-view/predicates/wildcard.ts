import { pipe } from 'remeda'
import type { FqnExpr } from '../../../types'
import { imap, toArray } from '../../../utils'
import type { Elem, PredicateExecutor } from '../_types'
import { findConnectionsWithin } from '../utils'
import { applyElementPredicate } from './utils'

export const WildcardPredicate: PredicateExecutor<FqnExpr.Wildcard> = {
  include: ({ model, stage, where }) => {
    const children = [] as Elem[]
    let rootElements: Elem[]

    if (where) {
      rootElements = pipe(
        [...model.elements()],
        applyElementPredicate(where),
      )
    } else {
      rootElements = toArray(
        imap(model.roots(), root => {
          if (!root.onlyOneInstance()) {
            children.push(...root.children())
          }
          return root
        }),
      )
    }

    stage.addExplicit(rootElements)
    if (children.length > 1) {
      stage.addConnections(findConnectionsWithin([
        ...rootElements,
        ...children,
      ]))
      stage.connectWithExisting(children)
    } else {
      stage.addConnections(findConnectionsWithin(rootElements))
    }
    stage.connectWithExisting(rootElements)
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
