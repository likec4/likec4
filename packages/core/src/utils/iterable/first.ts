import type { IteratorLike } from '../../types'
import { invariant } from '../../utils/invariant'

/**
 * Takes the first N elements from an iterable.
 * Composable first version of `ifirst`.
 * @signature
 *   ifirst(count)(data)
 */
export function ifirst<T>(count: number): (iterable: Iterable<T>) => IteratorLike<T>

/**
 * Takes the first N elements from an iterable.
 * Data first version of `ifirst`.
 * @signature
 *   ifirst(data, count)
 * @example
 *   ifirst([1, 2, 3, 4, 5], 3) // => Iterable<[1, 2, 3]>
 */
export function ifirst<T>(iterable: Iterable<T>, count: number): IteratorLike<T>

export function ifirst(
  arg1: unknown,
  arg2?: unknown,
): IteratorLike<unknown> | ((it: Iterable<unknown>) => IteratorLike<unknown>) {
  const count = (arg2 ?? arg1) as number
  invariant(typeof count === 'number' && count >= 0, 'Count must be a non-negative number')

  function* _first(iter: Iterable<unknown>): IteratorLike<unknown> {
    let taken = 0
    for (const value of iter) {
      if (taken >= count) {
        break
      }
      yield value
      taken++
    }
    return
  }

  if (arg2 === undefined) {
    // Composable version: ifirst(count)(iterable)
    return (iterable: Iterable<unknown>) => _first(iterable)
  }

  // Data-first version: ifirst(iterable, count)
  return _first(arg1 as Iterable<unknown>)
}
