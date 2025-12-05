import { isFunction } from 'remeda'
import type { IteratorLike } from '../../types'
import { invariant } from '../../utils/invariant'

type FlatMapFunction<T, S> = (item: T) => Iterable<S>

/**
 * Maps an iterable using a mapper function and flattens the result by one level.
 * Composable first version of `iflatMap`.
 * @signature
 *   iflatMap(mapper)(data)
 */
export function iflatMap<T, S>(mapper: FlatMapFunction<T, S>): (iterable: Iterable<T>) => IteratorLike<S>
/**
 * Maps an iterable using a mapper function and flattens the result by one level.
 * Data first version of `iflatMap`.
 * @signature
 *   iflatMap(data, mapper)
 */
export function iflatMap<T, S>(iterable: Iterable<T>, mapper: FlatMapFunction<T, S>): IteratorLike<S>

export function iflatMap(
  arg1: unknown,
  arg2?: unknown,
): IteratorLike<unknown> | ((it: Iterable<unknown>) => IteratorLike<unknown>) {
  const mapper = (arg2 ?? arg1) as FlatMapFunction<any, any>
  invariant(isFunction(mapper))

  function* _flatMap(iter: Iterable<unknown>): IteratorLike<unknown> {
    for (const value of iter) {
      const mapped = mapper(value)
      yield* mapped
    }
    return
  }

  if (!arg2) {
    return _flatMap
  }
  return _flatMap(arg1 as Iterable<unknown>)
}
