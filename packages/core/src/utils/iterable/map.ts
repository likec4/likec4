import { isFunction } from 'remeda'
import { invariant } from '../../errors'
import type { IteratorLike } from '../../types'

type MapFunction<T, S> = (item: T) => S

/**
 * Maps an iterable using a mapper function.
 * Composable first version of `imap`.
 * @signature
 *   imap(mapper)(data)
 */
export function imap<T, S>(mapper: MapFunction<T, S>): (iterable: Iterable<T>) => IteratorLike<S>
/**
 * Maps an iterable using a mapper function.
 * Data first version of `imap`.
 * @signature
 *   imap(data, mapper)
 */
export function imap<T, S>(iterable: Iterable<T>, mapper: MapFunction<T, S>): IteratorLike<S>

export function imap(
  arg1: unknown,
  arg2?: unknown,
): IteratorLike<unknown> | ((it: Iterable<unknown>) => IteratorLike<unknown>) {
  const mapper = (arg2 ?? arg1) as MapFunction<any, any>
  invariant(isFunction(mapper))

  function* _map(iter: Iterable<unknown>): IteratorLike<unknown> {
    for (const value of iter) {
      yield mapper(value)
    }
    return
  }

  if (!arg2) {
    return _map
  }
  return _map(arg1 as Iterable<unknown>)
}
