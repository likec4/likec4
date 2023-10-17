import type { NonEmptyArray } from '../types'
export { hasAtLeast } from 'remeda'

export function isString(value: unknown): value is string {
  return value != null && typeof value === 'string'
}

export function isNonEmptyArray<A>(arr: ArrayLike<A>): arr is NonEmptyArray<A> {
  return arr.length > 0
}
