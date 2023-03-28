import type { Fqn, Element } from './element'
import type { RelationID, Relation } from './relation'
import type { ViewID, ElementView } from './view'

export interface LikeC4Model {
  elements: Record<Fqn, Element>
  relations: Record<RelationID, Relation>
  views: Record<ViewID, ElementView>
}
