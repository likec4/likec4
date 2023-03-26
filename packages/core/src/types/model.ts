import type { Fqn, Element } from './element'
import type { RelationID, Relation } from './relation'

export interface LikeC4Model {
  elements: Record<Fqn, Element>
  relations: Record<RelationID, Relation>
}
