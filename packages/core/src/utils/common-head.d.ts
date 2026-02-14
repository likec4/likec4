/**
 * Common head of two arrays
 *
 * @param equals - Equality function, defaults to `Object.is`
 */
export declare function commonHead<T>(sources: ReadonlyArray<T>, targets: ReadonlyArray<T>, equals?: (a: T, b: T) => boolean): T[];
