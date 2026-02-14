import type { IteratorLike } from '../../types';
export declare function iflat(): <T>(iterable: Iterable<IteratorLike<T>>) => IteratorLike<T>;
export declare function iflat<T>(iterable: Iterable<IteratorLike<T>>): IteratorLike<T>;
