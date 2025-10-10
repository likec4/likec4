import type { AnyScalar } from '../types'

/**
 * Utility function to extract `id` from the given element.
 */
export const getId = <Id extends string, Scalar extends AnyScalar<Id>>(element: Id | { id: Scalar }): Scalar => {
  return typeof element === 'string' ? element as unknown as Scalar : element.id
}
