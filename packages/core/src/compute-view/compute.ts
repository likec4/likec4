import { compact, find, map, mapToObj } from 'remeda'
import { ModelIndex } from '../model-index'
import type {
  ComputedView,
  Element,
  ElementView,
  Fqn,
  Relation,
  RelationID,
  ViewID
} from '../types'
import { computeElementView } from './compute-element-view'

export function computeView<V extends ElementView>(view: V, index: ModelIndex) {
  try {
    return computeElementView(view, index)
  } catch (e) {
    console.error(e)
    return null
  }
}

type InputModel = {
  elements: Record<Fqn, Element>
  relations: Record<RelationID, Relation>
  views: ElementView[]
}

type OutputModel = {
  elements: Record<Fqn, Element>
  relations: Record<RelationID, Relation>
  views: Record<ViewID, ComputedView>
}

export function computeViews(model: InputModel): OutputModel {
  const index = ModelIndex.from(model)
  const computedViews = compact(map(model.views, view => computeView(view, index)))
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
