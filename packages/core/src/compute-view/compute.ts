import { map } from 'rambdax'
import { ModelIndex } from '../model-index'
import type { Element, ElementView, Fqn, Relation, RelationID, ViewID, ComputeResult } from '../types'
import { computeElementView } from './compute-element-view'

export function computeView<V extends ElementView>(view: V, index: ModelIndex): ComputeResult<V> {
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
  views: Record<ViewID, ComputeResult<V>>
}

export function computeViews<V extends ElementView>(model: InputModel<V>): OutputModel<V> {
  const index = ModelIndex.from(model)
  return {
    elements: model.elements,
    relations: model.relations,
    views: map(v => computeElementView(v, index), model.views)
  }
}
