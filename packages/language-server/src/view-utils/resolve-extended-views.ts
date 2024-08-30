import graphlib from '@dagrejs/graphlib'
import { isExtendsElementView, type LikeC4View } from '@likec4/core'
import { logger } from '@likec4/log'
import { first, last, values } from 'remeda'

// '@dagrejs/graphlib' is a CommonJS module
// Here is a workaround to import it
const { Graph, alg } = graphlib

/**
 * Resolve rules of extended views
 * (Removes invalid views)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveRulesExtendedViews<V extends Record<any, LikeC4View>>(
  unresolvedViews: V
): V {
  const g = new Graph({
    directed: true,
    multigraph: false,
    compound: false
  })
  for (const view of values(unresolvedViews)) {
    g.setNode(view.id)
    if (isExtendsElementView(view)) {
      // view -> parent
      g.setEdge(view.id, view.extends)
    }
  }
  if (g.edgeCount() === 0) {
    return unresolvedViews
  }

  // Remove circular dependencies
  while (!alg.isAcyclic(g)) {
    const firstCycle = first(alg.findCycles(g))
    if (!firstCycle) {
      break
    }
    const cycledNode = last(firstCycle)
    if (!cycledNode) {
      break
    }
    g.removeNode(cycledNode)
  }

  const ordered = alg.postorder(g, g.sources())

  return ordered.reduce((acc, id) => {
    const view = unresolvedViews[id]
    if (!view) {
      return acc
    }
    if (isExtendsElementView(view)) {
      const extendsFrom = acc[view.extends]
      if (!extendsFrom) {
        logger.debug(`View "${view.id}" extends from "${view.extends}" which does not exist`)
        return acc
      }
      return Object.assign(acc, {
        [view.id]: {
          ...extendsFrom,
          ...view,
          rules: [...extendsFrom.rules, ...view.rules]
        }
      })
    }
    return Object.assign(acc, { [view.id]: view })
  }, {} as V)
}
