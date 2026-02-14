import type { IteratorLike } from '../../types';
/**
 * Filters an iterable based on a predicate.
 * Composabel first version of `ifilter`.
 * @signature
 *    ifilter(predicate)(data)
 */
export declare function ifilter<T, S extends T>(predicate: (v: T) => v is S): (iterable: Iterable<T>) => IteratorLike<S>;
export declare function ifilter<T>(predicate: (v: T) => boolean): (iterable: Iterable<T>) => IteratorLike<T>;
/**
 * Filters an iterable based on a predicate.
 * Data first version of `ifilter`.
 * @signature
 *    ifilter(data, predicate)
 * @example
 *    ifilter(new Set([1, 2, 3]), x => x % 2 === 1) // => Iterable<[1, 3]>
 */
export declare function ifilter<T, S extends T>(iterable: Iterable<T>, predicate: (v: T) => v is S): IteratorLike<S>;
export declare function ifilter<T>(iterable: Iterable<T>, predicate: (v: T) => boolean): IteratorLike<T>;
