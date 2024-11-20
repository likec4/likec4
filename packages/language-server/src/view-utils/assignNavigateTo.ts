import { ComputedNode, type ComputedView, type Fqn, isElementView, type ViewID } from '@likec4/core'
import { find, isNullish } from 'remeda'

export function assignNavigateTo<R extends Iterable<ComputedView>>(views: R): R {
  const allElementViews = new Map<Fqn, ViewID[]>()

  for (const v of views) {
    if (isElementView(v) && v.viewOf && isNullish(v.extends)) {
      const viewsOf = allElementViews.get(v.viewOf) ?? []
      viewsOf.push(v.id)
      allElementViews.set(v.viewOf, viewsOf)
    }
  }

  // set default navigateTo
  for (const { id, nodes } of views) {
    for (const node of nodes) {
      const modelRef = ComputedNode.modelRef(node)
      if (node.navigateTo || !modelRef) {
        continue
      }
      // find first element view that is not the current one
      const navigateTo = find(allElementViews.get(modelRef) ?? [], v => v !== id)
      if (navigateTo) {
        node.navigateTo = navigateTo
      }
    }
  }

  return views
}
