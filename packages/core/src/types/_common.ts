import type { Opaque } from './opaque'

export type NonEmptyArray<T> = [T, ...T[]] | [...T[], T]

export type IconUrl = Opaque<string, 'IconUrl'>
