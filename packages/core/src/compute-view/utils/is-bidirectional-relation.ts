import type { AnyRelationshipModel } from '../../model'
import type { AnyAux } from '../../types'

/**
 * Relationship is traversable from both endpoints,
 * either because it was declared with `<->` or because it renders arrows on both ends.
 */
export function isBidirectionalRelation<A extends AnyAux>(relation: AnyRelationshipModel<A>): boolean {
  return relation.isBidirectional || relation.tail === 'normal'
}
