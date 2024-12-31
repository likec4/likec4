import { isFunction } from 'remeda'
import { invariant } from '../../errors'

/**
 * Checks if at least one element in the iterable satisfies the predicate.
 * Composable first version of `some`.
 * @signature
 *   isome(predicate)(data)
 */
export function isome<T>(predicate: (item: T) => boolean): (iterable: Iterable<T>) => boolean
/**
 * Checks if at least one element in the iterable satisfies the predicate.
 * Data first version of `some`.
 * @signature
 *  isome(data, predicate)
 */
export function isome<T>(iterable: Iterable<T>, predicate: (item: T) => boolean): boolean

export function isome<T>(arg1: unknown, arg2?: unknown): boolean | ((iterable: Iterable<T>) => boolean) {
  const pred = (arg2 ?? arg1) as (v: any) => boolean
  invariant(isFunction(pred))

  function _some(iter: Iterable<unknown>): boolean {
    for (const value of iter) {
      if (pred(value)) {
        return true
      }
    }
    return false
  }

  if (!arg2) {
    return _some
  }
  return _some(arg1 as Iterable<unknown>)
}
