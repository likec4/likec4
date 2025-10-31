import type { ThemeColor, ViewChange } from '@likec4/core/types'

export const SemanticColors = [
  'primary',
  'secondary',
  'muted',
] as const

export type OnStyleChange = (style: ViewChange.ChangeElementStyle['style']) => void

export type ThemeColorKey = typeof SemanticColors[number]
export type ColorKey = Exclude<ThemeColor, ThemeColorKey>
