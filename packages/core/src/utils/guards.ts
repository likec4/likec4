import { NonExhaustiveError } from '../errors'
import type { NonEmptyArray } from '../types'

export function isString(value: unknown): value is string {
  return value != null && typeof value === 'string'
}

export function failUnexpected(arg: never): never {
  throw new NonExhaustiveError(`Unexpected value: ${JSON.stringify(arg)}`)
}

export function ignoreNeverInRuntime(arg: never): void {
  console.warn(`Unexpected and ignored value: ${JSON.stringify(arg)}`)
  // throw new Error(`Unexpected value: ${arg}`);
}

export function isNonEmptyArray<A>(arr: ArrayLike<A>): arr is NonEmptyArray<A> {
  return arr.length > 0
}
