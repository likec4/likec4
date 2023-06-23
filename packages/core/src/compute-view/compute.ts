import { map } from 'rambdax'
import { ModelIndex } from '../model-index'
import type { Element, ElementView, Fqn, LikeC4Model, Relation, ComputedView, RelationID, ViewID } from '../types'
import { computeElementView } from './compute-element-view'

export function computeView(view: ElementView, index: ModelIndex): ComputedView {
  return computeElementView(view, index)
}

type InputModel<V extends ElementView> = {
  elements: Record<Fqn, Element>
  relations: Record<RelationID, Relation>
  views: Record<ViewID, V>
}

type OutputModel<V extends ElementView> = {
  elements: Record<Fqn, Element>
  relations: Record<RelationID, Relation>
  views: Record<ViewID, V & Pick<ComputedView, 'autoLayout' | 'nodes' | 'edges'>>
}

export function computeViews<V extends ElementView>(model: InputModel<V>): OutputModel<V> {
  const index = ModelIndex.from(model)
  return {
    elements: model.elements,
    relations: model.relations,
    views: map(v => computeElementView<V>(v, index), model.views)
  }
}
