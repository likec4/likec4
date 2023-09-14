import { find } from 'rambdax'
import type { BaseError } from '../errors'
import { normalizeError } from '../errors'
import type { ModelIndex } from '../model-index'
import { type ComputedView, type ElementView, type Fqn, type ViewID } from '../types'
import { computeElementView } from './compute-element-view'

type ComputeViewResult =
  | {
      isSuccess: true
      view: ComputedView
    }
  | {
      isSuccess: false
      error: BaseError
      view: undefined
    }

export function computeView(view: ElementView, index: ModelIndex): ComputeViewResult {
  try {
    return {
      isSuccess: true,
      view: computeElementView(view, index)
    }
  } catch (e) {
    return {
      isSuccess: false,
      error: normalizeError(e),
      view: undefined
    }
  }
}

// export type CmpInputModel = {
//   elements: Record<Fqn, Element>
//   relations: Record<RelationID, Relation>
//   views: ElementView[]
// }

// export type CmpOutputModel = {
//   elements: Record<Fqn, Element>
//   relations: Record<RelationID, Relation>
//   views: Record<ViewID, ComputedView>
// }

// export function computeViews(allViews: Record<ViewID, ElementView>, index: ModelIndex): Record<ViewID, ComputedView> {
//   const [viewExtends, views] = partition(values(allViews), isExtendsElementView)

//   const cache = new WeakMap<ElementView, ComputeCtx>()

//   const computedViews = views.flatMap(view => {
//     const ctx = ComputeCtx.create(view, index)
//     cache.set(view, ctx)
//     try {
//       return computeElementView(view, index, ctx)
//     } catch (e) {
//       return []
//     }
//   })
// }

export function assignNavigateTo<R extends Iterable<ComputedView>>(views: R): R {
  const allElementViews = new Map<Fqn, ViewID[]>()

  for (const v of views) {
    if (v.viewOf && !v.extends) {
      const viewsOf = allElementViews.get(v.viewOf) ?? []
      viewsOf.push(v.id)
      allElementViews.set(v.viewOf, viewsOf)
    }
  }

  // set default navigateTo
  for (const { id, nodes } of views) {
    for (const node of nodes) {
      // find first element view that is not the current one
      const navigateTo = find(v => v !== id, allElementViews.get(node.id) ?? [])
      if (navigateTo) {
        node.navigateTo = navigateTo
      }
    }
  }

  return views
}
