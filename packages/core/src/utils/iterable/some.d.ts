/**
 * Checks if at least one element in the iterable satisfies the predicate.
 * Composable first version of `some`.
 * @signature
 *   isome(predicate)(data)
 */
export declare function isome<T>(predicate: (item: T) => boolean): (iterable: Iterable<T>) => boolean;
/**
 * Checks if at least one element in the iterable satisfies the predicate.
 * Data first version of `some`.
 * @signature
 *  isome(data, predicate)
 */
export declare function isome<T>(iterable: Iterable<T>, predicate: (item: T) => boolean): boolean;
