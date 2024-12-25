import { filter } from 'remeda'
import { findConnectionsBetween, findConnectionsWithin } from '../../../model/connection/model'
import type { WildcardExpr } from '../../../types/expression'
import { ifilter, toArray } from '../../../utils/iterable'
import { toSet } from '../../../utils/iterable/to'
import { type PredicateExecutor, Memory } from '../_types'
import { NoWhere } from '../utils'

export const WildcardPredicate: PredicateExecutor<WildcardExpr> = {
  include: ({ scope, model, stage, memory, where }) => {
    if (!scope) {
      const rootElements = [...model.roots()].filter(where)
      if (rootElements.length === 0) {
        return
      }
      stage.addExplicit(rootElements)
      stage.addConnections(findConnectionsWithin(rootElements))

      stage.connectWithExisting(rootElements)

      return stage
    }
    const root = where(scope) ? scope : null

    const children = toArray(ifilter(scope.children(), where))
    const hasChildren = children.length > 0
    if (!hasChildren) {
      if (!root) {
        return stage
      } else {
        // Any edges with siblings?
        const edgesWithSiblings = findConnectionsBetween(root, root.siblings())
        if (edgesWithSiblings.length === 0) {
          // If no edges with siblings, i.e. root is orphan
          // Lets add parent for better view
          const parent = root.parent
          if (parent && where(parent)) {
            stage.addExplicit(parent)
          }
        }
        children.push(root)
      }
    }

    if (root) {
      stage.addExplicit(root)
    }

    const neighbours = toSet([
      ...memory.elements,
      ...scope.descendingSiblings(),
    ])

    // Add incoming connections
    for (const neighbour of neighbours) {
      stage.addConnections(findConnectionsBetween(neighbour, children, 'directed'))
    }

    // connection between children
    if (hasChildren) {
      stage.addConnections(findConnectionsWithin(children))
      stage.addExplicit(children)
    }

    // Add outgoing connections
    for (const child of children) {
      stage.addConnections(findConnectionsBetween(child, neighbours, 'directed'))
    }

    return stage
  },
  exclude: ({ scope, memory, stage, where }) => {
    if (where !== NoWhere) {
      stage.exclude(
        filter(
          [...memory.elements],
          where,
        ),
      )
      return stage
    }
    if (scope) {
      stage.exclude([scope, ...scope.descendants()])
      return stage
    }
    return Memory.empty(memory.scope).stageExclude(stage.expression)
  },
}
