import type { Element, Fqn } from './element'
import type { Relation, RelationID } from './relation'
import type { ComputedView, View, ViewID } from './view'

export interface LikeC4Model {
  elements: Record<Fqn, Element>
  relations: Record<RelationID, Relation>
  views: Record<ViewID, View>
}

export interface LikeC4ComputedModel {
  elements: Record<Fqn, Element>
  relations: Record<RelationID, Relation>
  views: Record<ViewID, ComputedView>
}
