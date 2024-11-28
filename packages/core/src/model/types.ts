import { isString } from '../utils/guards'
import type { LikeC4Model } from './LikeC4Model'

export type AnyAux = LikeC4Model.Any

export type IncomingFilter = 'all' | 'direct' | 'to-descendants'
export type OutgoingFilter = 'all' | 'direct' | 'from-descendants'

/**
 * Utility function to extract `id` from the given element.
 */
export function getId<Id extends string>(element: string | { id: Id }): Id {
  return isString(element) ? element as Id : element.id
}

export type IteratorLike<T> = IteratorObject<T, BuiltinIteratorReturn>
