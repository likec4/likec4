import { isFunction } from 'remeda'
import { invariant } from '../../errors'

/**
 * Finds the first element in the iterable that satisfies the predicate.
 * Composable first version of `find`.
 * @signature
 *   ifind(predicate)(data)
 */
export function ifind<T>(predicate: (item: T) => boolean): (iterable: Iterable<T>) => T | undefined
/**
 * Finds the first element in the iterable that satisfies the predicate.
 * Data first version of `find`.
 * @signature
 *  ifind(data, predicate)
 */
export function ifind<T>(iterable: Iterable<T>, predicate: (item: T) => boolean): T | undefined

export function ifind(arg1: unknown, arg2?: unknown) {
  const pred = (arg2 ?? arg1) as (v: any) => boolean
  invariant(isFunction(pred))

  function _find(iter: Iterable<unknown>) {
    for (const value of iter) {
      if (pred(value)) {
        return value
      }
    }
    return
  }

  if (!arg2) {
    return _find
  }
  return _find(arg1 as Iterable<unknown>)
}
