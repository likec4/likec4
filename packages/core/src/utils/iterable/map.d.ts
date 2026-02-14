import type { IteratorLike } from '../../types';
type MapFunction<T, S> = (item: T) => S;
/**
 * Maps an iterable using a mapper function.
 * Composable first version of `imap`.
 * @signature
 *   imap(mapper)(data)
 */
export declare function imap<T, S>(mapper: MapFunction<T, S>): (iterable: Iterable<T>) => IteratorLike<S>;
/**
 * Maps an iterable using a mapper function.
 * Data first version of `imap`.
 * @signature
 *   imap(data, mapper)
 */
export declare function imap<T, S>(iterable: Iterable<T>, mapper: MapFunction<T, S>): IteratorLike<S>;
export {};
