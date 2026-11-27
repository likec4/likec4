import type { IsAny, IsUnknown, Or, SetNonNullable, SetRequired } from 'type-fest'
import type { NonEmptyArray } from './_common'
import { isArray } from 'remeda'
import { invariant } from '../utils/invariant'
import { type ExtractOnStage, type ModelStage, _stage } from './const'

export function isString(value: unknown): value is string {
  return value != null && typeof value === 'string'
}

export function isNonEmptyArray<A>(arr: ArrayLike<A> | undefined): arr is NonEmptyArray<A> {
  return !!arr && Array.isArray(arr) && arr.length > 0
}

function _hasProp(value: unknown, path: string): boolean {
  invariant(typeof path === 'string', 'Path must be string')
  return value != null && typeof value === 'object' && Object.hasOwn(value, path) &&
    (value as Record<string, unknown>)[path] != null
}

/** Curried form: returns a predicate (value) => boolean. Kept as named function so bundlers/transforms preserve it. */
function hasPropCurried(path: string): (value: unknown) => boolean {
  return (value: unknown) => _hasProp(value, path)
}

export function hasProp<T extends object, P extends keyof T & string>(
  value: T,
  path: P,
  // @ts-expect-error could be instantiated with an arbitrary type
): value is SetRequired<SetNonNullable<T, P>, P>
export function hasProp<const P extends string>(
  path: P,
): // @ts-expect-error could be instantiated with an arbitrary type
<T>(value: T) => value is T & { [K in P]: NonNullable<T[K]> }
export function hasProp(...args: any[]) {
  if (args.length === 1 && typeof args[0] === 'string') {
    return hasPropCurried(args[0])
  }
  const [value, path] = args
  return _hasProp(value, path)
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
export type GuardedBy<G extends Function> =
  // dprint-ignore
  G extends Guard<infer To>
    ? Or<IsAny<To>,IsUnknown<To>> extends true
      ? never
      : To
    : never

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
): <T>(value: T) => value is T & GuardedBy<Predicates[number]> {
  return ((value: any) => {
    return predicates.some(predicate => predicate(value))
  }) as any
}

export function hasChildren<C, A extends { children?: C[] }>(value: A): value is A & { children: NonEmptyArray<C> } {
  return isArray(value.children) && value.children.length > 0
}

export function isOnStage<S extends ModelStage>(
  stage: S,
): <T extends { [_stage]: ModelStage }>(value: T) => value is ExtractOnStage<T, S>
export function isOnStage<T extends { [_stage]: ModelStage }, S extends ModelStage>(
  value: T,
  stage: S,
): value is ExtractOnStage<T, S>
export function isOnStage(...args: any[]): any {
  if (args.length === 1) {
    const stage = args[0]
    return (value: { [_stage]: ModelStage }) => value[_stage] === stage
  }
  const [value, stage] = args
  return value[_stage] === stage
}

export const isLayoutedStage: <T extends { [_stage]: ModelStage }>(value: T) => value is ExtractOnStage<T, 'layouted'> =
  isOnStage('layouted')
