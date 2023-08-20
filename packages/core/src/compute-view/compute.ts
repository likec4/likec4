import { compact, find, map, mapToObj } from 'remeda'
import { ModelIndex } from '../model-index'
import type { ComputedView, Element, ElementView, Fqn, Relation, RelationID, ViewID } from '../types'
import { computeElementView } from './compute-element-view'
import { normalizeError, type BaseError } from '..'

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

export type CmpInputModel = {
  elements: Record<Fqn, Element>
  relations: Record<RelationID, Relation>
  views: ElementView[]
}

export type CmpOutputModel = {
  elements: Record<Fqn, Element>
  relations: Record<RelationID, Relation>
  views: Record<ViewID, ComputedView>
}

export function computeViews(model: CmpInputModel): CmpOutputModel {
  const index = ModelIndex.from(model)
  const computedViews = compact(map(model.views, view => computeView(view, index).view))
  return {
    elements: model.elements,
    relations: model.relations,
    views: mapToObj(computedViews, view => [view.id, view])
  }
}

export function assignNavigateTo<R extends Iterable<ComputedView>>(views: R): R {
  const allElementViews = new Map<Fqn, ViewID[]>()

  for (const { id, viewOf } of views) {
    if (viewOf) {
      const viewsOf = allElementViews.get(viewOf) ?? []
      viewsOf.push(id)
      allElementViews.set(viewOf, viewsOf)
    }
  }

  // set default navigateTo
  for (const { id, nodes } of views) {
    for (const node of nodes) {
      // find first element view that is not the current one
      const navigateTo = find(allElementViews.get(node.id) ?? [], v => v !== id)
      if (navigateTo) {
        node.navigateTo = navigateTo
      }
    }
  }

  return views
}
