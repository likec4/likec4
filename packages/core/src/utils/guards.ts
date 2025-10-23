import type { SetNonNullable, SetRequired } from 'type-fest'
import type { NonEmptyArray } from '../types'

export function isString(value: unknown): value is string {
  return value != null && typeof value === 'string'
}

export function isNonEmptyArray<A>(arr: ArrayLike<A> | undefined): arr is NonEmptyArray<A> {
  return !!arr && Array.isArray(arr) && arr.length > 0
}

export function hasProp<T extends object, P extends keyof T & string>(
  value: T,
  path: P,
  // @ts-expect-error could be instantiated with an arbitrary type
): value is SetRequired<SetNonNullable<T, P>, P> {
  return value[path] != null
}

type Guard<N = unknown> = (n: unknown) => n is N
type Guarded<G> = G extends Guard<infer N> ? N : never

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
export function isAnyOf<const Predicates extends NonEmptyArray<Guard>>(
  ...predicates: Predicates
): (value: unknown) => value is Guarded<Predicates[number]> {
  return (value: unknown): value is Guarded<Predicates[number]> => {
    return predicates.some(predicate => predicate(value))
  }
}
