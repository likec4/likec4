import { filter, partition } from 'remeda'
import type { ModelFqnExpr } from '../../../types'
import { ifilter, toArray } from '../../../utils/iterable'
import { toSet } from '../../../utils/iterable/to'
import { type PredicateExecutor, Memory } from '../_types'
import { NoWhere } from '../utils'
import { findConnectionsBetween, findConnectionsWithin } from './_utils'

export const WildcardPredicate: PredicateExecutor<ModelFqnExpr.Wildcard> = {
  include: ({ scope, model, stage, memory, where }) => {
    // include * where ....
    if (!scope) {
      const rootElements = where !== NoWhere
        ? toArray(ifilter(model.elements(), where))
        : [...model.roots()]
      if (rootElements.length === 0) {
        return
      }
      const [projectElements, importedElements] = partition(rootElements, e => !e.imported)
      stage.addExplicit(projectElements)
      stage.addImplicit(importedElements)

      stage.addConnections(findConnectionsWithin(rootElements))

      stage.connectWithExisting(rootElements)

      return stage
    }

    const children = toArray(ifilter(scope.children(), where))
    const hasChildren = children.length > 0
    if (!hasChildren) {
      // Any edges with siblings?
      const edgesWithSiblings = findConnectionsBetween(scope, scope.siblings())
      const parent = scope.parent
      if (edgesWithSiblings.length === 0 && parent) {
        // If no edges with siblings, i.e. root is orphan
        // Lets add parent for better view
        stage.addExplicit(parent)
      }
      children.push(scope)
    }

    stage.addExplicit(scope)

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
