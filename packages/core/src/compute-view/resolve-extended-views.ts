import { isExtendsElementView, type ElementView, type ViewID } from '../types'
import { InvalidModelError, invariant, nonNullable } from '../errors'
import pkg from '@dagrejs/graphlib'

// '@dagrejs/graphlib' is a CommonJS module
// Here is a workaround to import it
const { Graph, alg } = pkg

/**
 * Resolve rules of extended views
 */
export function resolveRulesExtendedViews<V extends Record<ViewID, ElementView>>(unresolvedViews: V): V {
  const g = new Graph({
    directed: true,
    multigraph: false,
    compound: false
  })
  for (const view of Object.values(unresolvedViews)) {
    g.setNode(view.id)
    if ('extends' in view) {
      invariant(unresolvedViews[view.extends], `Cannot find base view '${view.extends}' for '${view.id}'`)
      // g.setNode(view.extends)
      g.setEdge(view.extends, view.id)
    }
  }

  if (!alg.isAcyclic(g)) {
    throw new InvalidModelError('Circular view extends detected')
  }

  return alg.topsort(g).reduce((acc, id) => {
    const view = nonNullable(unresolvedViews[id as ViewID])
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
