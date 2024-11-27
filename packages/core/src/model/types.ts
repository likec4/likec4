import type { Fqn as C4Fqn } from '../types/element'
import type { RelationID as C4RelationID } from '../types/relation'
import type { EdgeId as C4EdgeId, NodeId as C4NodeId, ViewID as C4ViewID } from '../types/view'

import type { LiteralUnion } from 'type-fest'
import { isString } from '../utils/guards'

export type Fqn = LiteralUnion<C4Fqn, string>
export type RelationID = LiteralUnion<C4RelationID, string>
export type ViewID = LiteralUnion<C4ViewID, string>
export type NodeId = LiteralUnion<C4NodeId, string>
export type EdgeId = LiteralUnion<C4EdgeId, string>

export type IncomingFilter = 'all' | 'direct' | 'to-descendants'
export type OutgoingFilter = 'all' | 'direct' | 'from-descendants'

export type ElementOrFqn = Fqn | { id: Fqn }

/**
 * Utility function to extract `id` from the given element.
 */
export function getId<Id extends string>(element: Id | { id: Id }): Id {
  return isString(element) ? element : element.id
}
