import type { ComputedView } from './computed-view'
import type { Element, Fqn } from './element'
import type { Relation, RelationID } from './relation'
import type { ElementView, ViewID } from './view'

export interface LikeC4Model {
  elements: Record<Fqn, Element>
  relations: Record<RelationID, Relation>
  views: Record<ViewID, ElementView>
}

export interface LikeC4ComputedModel {
  elements: Record<Fqn, Element>
  relations: Record<RelationID, Relation>
  views: Record<ViewID, ComputedView>
}
