import { filter } from 'remeda'
import { findConnectionsBetween, findConnectionsWithin } from '../../../model/connection/model'
import type { WildcardExpr } from '../../../types/expression'
import { ifilter, toArray } from '../../../utils/iterable'
import { toSet } from '../../../utils/iterable/to'
import { Memory, type PredicateExecutor } from '../_types'
import { NoWhere } from '../utils'

export const WildcardPredicate: PredicateExecutor<WildcardExpr> = {
  include: ({ scope, model, stage, where }) => {
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
    const neighbours = toSet(ifilter(scope.ascendingSiblings(), where))
    const root = where(scope) ? scope : null
    if (root) {
      stage.addExplicit(root)
      stage.connectWithExisting(root)
      stage.addConnections(findConnectionsBetween(root, neighbours))
    }

    const children = toArray(ifilter(scope.children(), where))
    const hasChildren = children.length > 0
    if (hasChildren) {
      stage.connectWithExisting(children)
      stage.addConnections(findConnectionsWithin(children))
      for (const child of children) {
        stage.addConnections(findConnectionsBetween(child, neighbours))
      }
    }

    // If root has no children
    if (!hasChildren && root) {
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
