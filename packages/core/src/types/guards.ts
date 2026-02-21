import type { IsAny, IsUnknown, Or, SetNonNullable, SetRequired } from 'type-fest'
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
): value is SetRequired<SetNonNullable<T, P>, P>
export function hasProp<const P extends string>(
  path: P,
): // @ts-expect-error could be instantiated with an arbitrary type
<T>(value: T) => value is SetRequired<SetNonNullable<T, P>, P>
export function hasProp(...args: any[]) {
  if (args.length === 1) {
    const path = args[0] as string
    return (value: unknown) => value != null && typeof value === 'object' && path in value
  }
  const [value, path] = args
  return value != null && typeof value === 'object' && path in value
}

export type Guard<To = unknown> = (value: any) => value is To

/**
 * Extracts the guarded type from a Guard type.
 *
 * @template G - A Guard type or union of Guard types
 * @returns The type that the guard narrows to
 *
 * @example
 * ```typescript
 * const isString = (n): n is string => typeof n === 'string';
 * GuardedBy<typeof isString>; // string
 * ```
 */
export type GuardedBy<G> =
  // dprint-ignore
  G extends Guard<infer To>
    ? Or<IsAny<To>,IsUnknown<To>> extends true
      ? never
      : To
    : never

type NarrowTo<T, Base> =
  // dprint-ignore
  Extract<T, Base> extends never
    ? Base
    : IsAny<T> extends true
      ? Base
      : Extract<T, Base>
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
export function isAnyOf<const Predicates extends NonEmptyArray<Guard<any>>>(
  ...predicates: Predicates
): <T>(value: T | GuardedBy<Predicates[number]>) => value is NarrowTo<T, GuardedBy<Predicates[number]>> {
  return ((value: any) => {
    return predicates.some(predicate => predicate(value))
  }) as any
}
