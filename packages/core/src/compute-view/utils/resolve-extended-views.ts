import { values } from 'remeda'
import { type ExtendsElementView, isElementView, isExtendsElementView, type LikeC4View } from '../../types/view'

import Graph from 'graphology'
import { topologicalSort } from 'graphology-dag/topological-sort'
import willCreateCycle from 'graphology-dag/will-create-cycle'
/**
 * Resolve rules of extended views
 * (Removes invalid views)
 */
export function resolveRulesExtendedViews<V extends Record<any, LikeC4View>>(
  unresolvedViews: V
): V {
  const g = new Graph<{ view: LikeC4View }>({
    type: 'directed'
  })
  const extendedViews = [] as ExtendsElementView<any, any>[]
  for (const view of values(unresolvedViews)) {
    g.addNode(view.id, { view })
    if (isExtendsElementView(view)) {
      extendedViews.push(view)
    }
  }

  if (extendedViews.length === 0) {
    return unresolvedViews
  }

  for (const view of extendedViews) {
    if (!g.hasNode(view.extends)) {
      console.warn(`View "${view.id}" extends from "${view.extends}" which does not exist`)
      continue
    }
    if (willCreateCycle(g, view.id, view.extends)) {
      console.warn(`View "${view.id}" extends from "${view.extends}" which creates a cycle`)
      continue
    }

    // view -> parent
    g.addDirectedEdge(view.id, view.extends)
  }

  const sorted = topologicalSort(g).reverse()
  return sorted.reduce((acc, id) => {
    const view = g.getNodeAttribute(id, 'view')
    if (!isExtendsElementView(view)) {
      acc[view.id] = view
      return acc
    }

    const extendsFrom = acc[view.extends]
    if (!extendsFrom || !isElementView(extendsFrom)) {
      return acc
    }

    acc[view.id] = {
      ...extendsFrom,
      ...view,
      rules: [...extendsFrom.rules, ...view.rules]
    }
    return acc
  }, {} as Record<string, LikeC4View>) as V

  // forEachNodeInTopologicalOrder(g, (_id, { view }) => {

  // })

  // return ordered as V
}
