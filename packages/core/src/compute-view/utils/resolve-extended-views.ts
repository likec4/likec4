import { first, last, values } from 'remeda'
import { isExtendsElementView, type LikeC4View } from '../../types/view'
import { findCycles, Graph, isAcyclic, postorder } from '../../utils/graphlib'

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
    g.setNode(view.id, view.id)
    if (isExtendsElementView(view)) {
      // view -> parent
      g.setEdge(view.id, view.extends)
    }
  }
  if (g.edgeCount() === 0) {
    return unresolvedViews
  }

  // Remove circular dependencies
  while (!isAcyclic(g)) {
    const firstCycle = first(findCycles(g))
    if (!firstCycle) {
      break
    }
    const cycledNode = last(firstCycle)
    if (!cycledNode) {
      break
    }
    g.removeNode(cycledNode)
  }

  const ordered = postorder(g, g.sources() as unknown as string[])

  return ordered.reduce((acc, id) => {
    const view = unresolvedViews[id]
    if (!view) {
      return acc
    }
    if (isExtendsElementView(view)) {
      const extendsFrom = acc[view.extends]
      if (!extendsFrom) {
        console.warn(`View "${view.id}" extends from "${view.extends}" which does not exist`)
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
