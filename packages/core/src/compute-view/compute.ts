import { compact, find, map, mapToObj } from 'remeda'
import { ModelIndex } from '../model-index'
import type {
  ComputeResult,
  Element,
  ElementView,
  Fqn,
  Relation,
  RelationID,
  ViewID
} from '../types'
import { computeElementView } from './compute-element-view'

export function computeView<V extends ElementView>(
  view: V,
  index: ModelIndex
): ComputeResult<V> | null {
  try {
    return computeElementView(view, index)
  } catch (e) {
    console.error(e)
    return null
  }
}

type InputModel<V extends ElementView> = {
  elements: Record<Fqn, Element>
  relations: Record<RelationID, Relation>
  views: V[]
}

type OutputModel<V extends ElementView> = {
  elements: Record<Fqn, Element>
  relations: Record<RelationID, Relation>
  views: Record<ViewID, ComputeResult<V>>
}

export function computeViews<V extends ElementView>(model: InputModel<V>): OutputModel<V> {
  const index = ModelIndex.from(model)
  const computedViews = compact(map(model.views, view => computeView(view, index)))
  return {
    elements: model.elements,
    relations: model.relations,
    views: mapToObj(computedViews, view => [view.id, view])
  }
}

export function assignNavigateTo<V extends ElementView, R extends ComputeResult<V>[]>(views: R): R {
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
