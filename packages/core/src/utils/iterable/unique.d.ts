import type { IteratorLike } from '../../types';
/**
 * Returns an iterable that yields only unique values.
 * It uses a Set to keep track of the values.
 */
export declare function iunique(): <T>(iterable: Iterable<T>) => IteratorLike<T>;
export declare function iunique<T>(iterable: Iterable<T>): IteratorLike<T>;
