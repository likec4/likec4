import type { AnyRelationshipModel } from '../../model'
import type { AnyAux } from '../../types'

/**
 * Relationship is traversable from both endpoints.
 */
export function isBidirectionalRelation<A extends AnyAux>(relation: AnyRelationshipModel<A>): boolean {
  return relation.isBidirectional
}
