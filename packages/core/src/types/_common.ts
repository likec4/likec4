import type { IsAny, Simplify, UnionToIntersection } from 'type-fest'

export type NonEmptyArray<T> = [T, ...T[]]

export type NonEmptyReadonlyArray<T> = readonly [T, ...T[]]

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

export type IteratorLike<T> = IteratorObject<T, BuiltinIteratorReturn>

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
