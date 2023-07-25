import type { NonEmptyArray } from "../types"

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function failExpectedNever(arg: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(arg)}`)
}

export function ignoreNeverInRuntime(arg: never): void {
  console.warn(`Unexpected and ignored value: ${JSON.stringify(arg)}`)
  // throw new Error(`Unexpected value: ${arg}`);
}

export function isNonEmptyArray<A>(arr: ArrayLike<A>): arr is NonEmptyArray<A>{
  return arr.length > 0
}
