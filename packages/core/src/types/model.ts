import type { Fqn, Element } from './element'
import type { RelationID, Relation } from './relation'
import type { ViewID } from './view'
import type { ComputedView } from '../compute-view'


export interface LikeC4Model {
  elements: Record<Fqn, Element>
  relations: Record<RelationID, Relation>
  views: Record<ViewID, ComputedView>
}
