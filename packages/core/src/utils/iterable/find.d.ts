/**
 * Finds the first element in the iterable that satisfies the predicate.
 * Composable first version of `find`.
 * @signature
 *   ifind(predicate)(data)
 */
export declare function ifind<T, S extends T>(predicate: (item: T) => item is S): (iterable: Iterable<T>) => S | undefined;
export declare function ifind<T>(predicate: (item: T) => boolean): (iterable: Iterable<T>) => T | undefined;
/**
 * Finds the first element in the iterable that satisfies the predicate.
 * Data first version of `find`.
 * @signature
 *  ifind(data, predicate)
 */
export declare function ifind<T, S extends T>(iterable: Iterable<T>, predicate: (item: T) => item is S): S | undefined;
export declare function ifind<T>(iterable: Iterable<T>, predicate: (item: T) => boolean): T | undefined;
