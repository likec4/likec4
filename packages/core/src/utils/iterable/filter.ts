import { isFunction } from 'remeda'
import { invariant } from '../../errors'
import type { IteratorLike } from '../../types'

/**
 * Filters an iterable based on a predicate.
 * Composabel first version of `ifilter`.
 * @signature
 *    ifilter(predicate)(data)
 */
export function ifilter<T, S extends T>(
  predicate: (v: T) => v is S,
): (iterable: Iterable<T>) => IteratorLike<S>
export function ifilter<T>(
  predicate: (v: T) => boolean,
): (iterable: Iterable<T>) => IteratorLike<T>

/**
 * Filters an iterable based on a predicate.
 * Data first version of `ifilter`.
 * @signature
 *    ifilter(data, predicate)
 * @example
 *    ifilter(new Set([1, 2, 3]), x => x % 2 === 1) // => Iterable<[1, 3]>
 */
export function ifilter<T, S extends T>(
  iterable: Iterable<T>,
  predicate: (v: T) => v is S,
): IteratorLike<S>
export function ifilter<T>(
  iterable: Iterable<T>,
  predicate: (v: T) => boolean,
): IteratorLike<T>

export function ifilter(
  arg1: unknown,
  arg2?: unknown,
): IteratorLike<unknown> | ((it: Iterable<unknown>) => IteratorLike<unknown>) {
  const pred = (arg2 ?? arg1) as (v: any) => boolean
  invariant(isFunction(pred))

  function* _filter(iter: Iterable<unknown>): IteratorLike<unknown> {
    for (const value of iter) {
      if (pred(value)) {
        yield value
      }
    }
    return
  }

  if (!arg2) {
    return _filter
  }
  return _filter(arg1 as Iterable<unknown>)
}
