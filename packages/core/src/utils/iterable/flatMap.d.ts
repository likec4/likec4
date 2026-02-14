import type { IteratorLike } from '../../types';
type FlatMapFunction<T, S> = (item: T) => Iterable<S>;
/**
 * Maps an iterable using a mapper function and flattens the result by one level.
 * Composable first version of `iflatMap`.
 * @signature
 *   iflatMap(mapper)(data)
 */
export declare function iflatMap<T, S>(mapper: FlatMapFunction<T, S>): (iterable: Iterable<T>) => IteratorLike<S>;
/**
 * Maps an iterable using a mapper function and flattens the result by one level.
 * Data first version of `iflatMap`.
 * @signature
 *   iflatMap(data, mapper)
 */
export declare function iflatMap<T, S>(iterable: Iterable<T>, mapper: FlatMapFunction<T, S>): IteratorLike<S>;
export {};
