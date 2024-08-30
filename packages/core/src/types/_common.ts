import type { Tagged } from 'type-fest'

export type NonEmptyArray<T> = [T, ...T[]]

export type IconUrl = Tagged<string, 'IconUrl'>

export type CustomColor = Opaque<string, 'CustomColor'>

export type Point = readonly [x: number, y: number]

export interface XYPoint {
  x: number
  y: number
}
