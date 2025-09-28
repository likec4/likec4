import type { SetNonNullable, SetRequired } from 'type-fest'
import type { NonEmptyArray } from '../types'

export function isString(value: unknown): value is string {
  return value != null && typeof value === 'string'
}

export function isNonEmptyArray<A>(arr: ArrayLike<A> | undefined): arr is NonEmptyArray<A> {
  return !!arr && Array.isArray(arr) && arr.length > 0
}

// export function hasProp<T, P extends Paths<T, { maxRecursionDepth: 4 }> & string>(
//   value: T,
//   path: P,
// ): value is SetNonNullableDeep<T, P> {
//   if (path.includes('.')) {
//     // @ts-ignore we know that path is a string and it has at least 2 parts
//     return prop(value, ...path.split('.')) != null
//   }
//   // @ts-ignore P is Paths<T>
//   return path in value && value[path] != null
// }

// export function hasProp<T extends object, P extends Exclude<keyof T, OptionalKeysOf<T>>>(
export function hasProp<T extends object, P extends keyof T & string>(
  value: T,
  path: P,
  // @ts-expect-error could be instantiated with an arbitrary type
): value is SetRequired<SetNonNullable<T, P>, P> {
  return value[path] != null
}
