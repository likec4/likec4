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
 * ```
 *   type Variant1 = {
 *     a: string
 *     b: number
 *   }
 *   type Variant2 = {
 *     a: boolean
 *   }
 *
 *   type Variants = ExclusiveUnion<{
 *     Variant1: Variant1,
 *     Variant2: Variant2
 *   }>
 *
 *   // Type 'true' is not assignable to type 'string'.
 *   const variant1: Variants = {
 *      a: true,
 *      b: 1
 *   }
 *
 * ```
 */

export type ExclusiveUnion<Expressions> = Expressions extends object ? {
    [Name in keyof Expressions]: Simplify<Omit<AllNever<Expressions>, keyof Expressions[Name]> & Expressions[Name]>
  }[keyof Expressions]
  : Expressions
