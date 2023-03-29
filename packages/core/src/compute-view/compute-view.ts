import { map } from 'rambdax'
import { ModelIndex } from '../model-index'
import type { Element, ElementView, Fqn, LikeC4Model, Relation, RelationID, ViewID } from '../types'
import { computeElementView } from './compute.element-view'
import type { ComputedView } from './types'
// import type { ComputedView, DiagramData, View } from '../types';
// import { isDynamicView } from '../types'
// import { computeDynamicView } from './compute.dynamic-view'

export function computeView(view: ElementView, index: ModelIndex): ComputedView {
  // if (isDynamicView(view)) {
  //   const { steps: _steps, rules: _rules, ...rest } = view
  //   const computed = computeDynamicView(view, index)
  //   return {
  //     ...rest,
  //     computed
  //   }
  // }
  return computeElementView(view, index)
}

type InputModel = {
  elements: Record<Fqn, Element>
  relations: Record<RelationID, Relation>
  views: Record<ViewID, ElementView>
}


export function computeViews(model: InputModel): LikeC4Model {
  const index = ModelIndex.from(model)
  return {
    elements: model.elements,
    relations: model.relations,
    views: map(v => computeElementView(v, index), model.views)
  }
}
