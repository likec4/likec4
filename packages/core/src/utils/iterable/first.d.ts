import type { IteratorLike } from '../../types';
/**
 * Takes the first N elements from an iterable.
 * Composable first version of `ifirst`.
 * @signature
 *   ifirst(count)(data)
 */
export declare function ifirst<T>(count: number): (iterable: Iterable<T>) => IteratorLike<T>;
/**
 * Takes the first N elements from an iterable.
 * Data first version of `ifirst`.
 * @signature
 *   ifirst(data, count)
 * @example
 *   ifirst([1, 2, 3, 4, 5], 3) // => Iterable<[1, 2, 3]>
 */
export declare function ifirst<T>(iterable: Iterable<T>, count: number): IteratorLike<T>;
