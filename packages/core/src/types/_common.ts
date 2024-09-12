import type { Tagged } from 'type-fest'

export type NonEmptyArray<T> = [T, ...T[]]

export type NonEmptyReadonlyArray<T> = readonly [T, ...T[]]

export type IconUrl = Tagged<string, 'IconUrl'>

export type CustomColor = string

export type Point = readonly [x: number, y: number]

export interface XYPoint {
  x: number
  y: number
}
