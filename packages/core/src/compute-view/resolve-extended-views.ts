import graphlib from '@dagrejs/graphlib'
import { isExtendsElementView, type ElementView } from '../types'

// '@dagrejs/graphlib' is a CommonJS module
// Here is a workaround to import it
const { Graph, alg } = graphlib

/**
 * Resolve rules of extended views
 * (Removes invalid views)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveRulesExtendedViews<V extends Record<any, ElementView>>(
  unresolvedViews: V
): V {
  const g = new Graph({
    directed: true,
    multigraph: false,
    compound: false
  })
  for (const view of Object.values(unresolvedViews)) {
    g.setNode(view.id)
    if (isExtendsElementView(view)) {
      // view -> parent
      g.setEdge(view.id, view.extends)
    }
  }

  // Remove circular dependencies
  const cycles = alg.findCycles(g)
  if (cycles.length > 0) {
    cycles.flat().forEach(id => g.removeNode(id))
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
