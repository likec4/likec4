import pkg from '@dagrejs/graphlib'
import { invariant, nonNullable } from '../errors'
import { isExtendsElementView, type ElementView, type ViewID } from '../types'

// '@dagrejs/graphlib' is a CommonJS module
// Here is a workaround to import it
const { Graph, alg } = pkg

/**
 * Resolve rules of extended views
 * (Removes invalid views)
 */
export function resolveRulesExtendedViews<V extends Record<ViewID, ElementView>>(unresolvedViews: V): V {
  const g = new Graph({
    directed: true,
    multigraph: false,
    compound: false
  })
  for (const view of Object.values(unresolvedViews)) {
    if (!isExtendsElementView(view)) {
      g.setNode(view.id)
      continue
    }
    // this is an extends view
    if (unresolvedViews[view.extends]) {
      g.setEdge(view.extends, view.id)
    }
  }

  if (!alg.isAcyclic(g)) {
    alg
      .findCycles(g)
      .flat()
      .map(id => g.removeNode(id))
  }

  return alg.topsort(g).reduce((acc, id) => {
    const view = nonNullable(unresolvedViews[id as ViewID], `Cannot find view ${id}`)
    if (isExtendsElementView(view)) {
      const extendsFrom = acc[view.extends]
      invariant(extendsFrom, `Cannot find base view '${view.extends}' for '${view.id}'`)
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
