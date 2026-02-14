export function isString(value) {
    return value != null && typeof value === 'string';
}
export function isNonEmptyArray(arr) {
    return !!arr && Array.isArray(arr) && arr.length > 0;
}
export function hasProp(value, path) {
    return value[path] != null;
}
/**
 * Creates a type guard that checks if a value matches any of the provided predicates.
 *
 * @template Predicates - A non-empty array of guard functions
 * @param predicates - The guard functions to test against
 * @returns A type guard function that returns true if the value matches any of the predicates
 *
 * @example
 * ```typescript
 * const isStringOrNumber = isAnyOf(isString, isNumber);
 *
 * if (isStringOrNumber(value)) {
 *   // value is now typed as string | number
 *   console.log(value);
 * }
 * ```
 */
export function isAnyOf(...predicates) {
    return ((value) => {
        return predicates.some(predicate => predicate(value));
    });
}
