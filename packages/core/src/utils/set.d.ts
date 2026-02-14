import type { NonEmptyArray } from '../types/_common';
/**
 * Returns new set as a union of given sets
 * Keeps order of elements
 */
export declare function union<T>(...sets: ReadonlySet<T>[]): Set<T>;
/**
 * Returns new set as an intersection of all sets
 * Keeps order from the first set
 */
export declare function intersection<T>(first: ReadonlySet<T>, ...sets: NonEmptyArray<ReadonlySet<NoInfer<T>>>): Set<T>;
/**
 * Returns new set as a difference of two sets (A-B)
 * Keeps order from the first set
 */
export declare function difference<T>(a: ReadonlySet<T>, b: ReadonlySet<NoInfer<T>>): Set<T>;
export declare function equals<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean;
export declare function symmetricDifference<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): Set<T>;
export declare function hasIntersection<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean;
