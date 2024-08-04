import type { Opaque } from './opaque'

export type NonEmptyArray<T> = [T, ...T[]] | [...T[], T]

export type IconUrl = Opaque<string, 'IconUrl'>

export type Point = readonly [x: number, y: number]

export interface XYPoint {
  x: number
  y: number
}
