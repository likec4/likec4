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

//   const mergeExtends = (view: ExtendsElementView): [ExtendsElementView, ComputeCtx] => {
//     const base = allViews[view.extends]
//     invariant(base, `Cannot find base view ${view.extends} for ${view.id}`)
//     let baseCtx = cache.get(base)
//     if (!baseCtx) {
//       if (isExtendsElementView(base)) {
//         const [baseView, baseCtx] = mergeExtends(base)
//         cache.set(base, baseCtx)
//       } else {
//         throw new InvalidModelError(`Cannot find ComputeCtx of base view ${view.extends} for ${view.id}`)
//       }
//     }
//     const [baseView, baseCtx] = isExtendsElementView(base) ? mergeExtends(base) : [base, cache.get(base)]
//     invariant(baseCtx, `Cannot find ComputeCtx of base view ${view.extends} for ${view.id}`)
//     const ctx = baseCtx.processViewRules(view.rules.filter(isViewRuleExpression))
//     return [{...baseView, ...view, rules: baseView.rules.concat(view.rules)}, ctx]
//   }

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
