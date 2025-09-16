import { omitBy } from 'remeda'
import type {
  Exact,
  IsAny,
  KeysOfUnion,
  Simplify,
  UnionToIntersection,
} from 'type-fest'

export type NonEmptyArray<T> = [T, ...T[]]

export type NonEmptyReadonlyArray<T> = readonly [T, ...T[]]

export type IterableContainer<T = unknown> = ReadonlyArray<T> | readonly []

export type ReorderedArray<T extends IterableContainer> = {
  -readonly [P in keyof T]: T[number]
}

// dprint-ignore
export type KeysOf<T> = keyof T extends infer K extends string ? K : never

type AllNever<Expressions> = UnionToIntersection<
  {
    [Name in keyof Expressions]: {
      -readonly [Key in keyof Expressions[Name]]?: never
    }
  }[keyof Expressions]
>

/**
 * @example
 * ```ts
 *   type Variant1 = {
 *     a: string
 *   }
 *   type Variant2 = {
 *     b: number
 *   }
 *
 *   type Variants = ExclusiveUnion<{
 *     Variant1: Variant1,
 *     Variant2: Variant2
 *   }>
 *
 *   // Fail here
 *   const variant1: Variants = {
 *      a: 'one',
 *      b: 1
 *   }
 * ```
 */
export type ExclusiveUnion<Expressions, All = AllNever<Expressions>> = Expressions extends object ? {
    [Name in keyof Expressions]: Simplify<Omit<All, keyof Expressions[Name]> & Expressions[Name]>
  }[keyof Expressions]
  : never

/**
 * Copy from https://github.com/remeda/remeda/blob/main/src/internal/types/NTuple.ts
 * An array with *exactly* N elements in it.
 *
 * Only literal N values are supported. For very large N the type might result
 * in a recurse depth error. For negative N the type would result in an infinite
 * recursion. None of these have protections because this is an internal type!
 */
export type NTuple<
  T,
  N extends number,
  Result extends Array<unknown> = [],
> = Result['length'] extends N ? Result : NTuple<T, N, [...Result, T]>

export type IteratorLike<T> = IteratorObject<T, BuiltinIteratorReturn, unknown>

export type Predicate<T> = (x: T) => boolean

export interface Link {
  title?: string
  // Value from Likec4 DSL
  url: string
  // Relative to workspace root (if url is relative),
  relative?: string
}

/**
 * Coalesce `V` to a string if it is `any`
 */
export type Coalesce<V extends string, OrIfAny = string> = IsAny<V> extends true ? OrIfAny : V

type ExactObject<T, InputType = unknown> =
  & {
    [KeyType in keyof T]: undefined extends T[KeyType] ? T[KeyType] | undefined : T[KeyType]
  }
  & Record<Exclude<keyof InputType, KeysOfUnion<T>>, never>

/**
 * Allows only exact properties of `U` to be present in `T` and omits undefined values
 *
 * See {@link Exact} for more details (this version is non-deep)
 */
export function omitUndefined<Expected, T extends ExactObject<Expected, T>>(a: T): Expected {
  return omitBy(a, v => v === undefined) as Expected
}
