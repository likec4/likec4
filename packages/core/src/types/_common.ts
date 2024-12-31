import type { Simplify, Tagged, UnionToIntersection } from 'type-fest'

export type NonEmptyArray<T> = [T, ...T[]]

export type NonEmptyReadonlyArray<T> = readonly [T, ...T[]]

export type IconUrl = Tagged<string, 'IconUrl'> | 'none'

export type CustomColor = string

export type Point = readonly [x: number, y: number]

export interface XYPoint {
  x: number
  y: number
}

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
 *   Fail here
 *   const variant1: Variants = {
 *      a: 'one',
 *      b: 1
 *   }
 */

export type ExclusiveUnion<Expressions> = Expressions extends object ? {
    [Name in keyof Expressions]: Simplify<Omit<AllNever<Expressions>, keyof Expressions[Name]> & Expressions[Name]>
  }[keyof Expressions]
  : Expressions

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
