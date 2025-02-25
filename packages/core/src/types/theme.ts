import type { LiteralUnion } from 'type-fest'

export const ThemeColors = [
  'amber',
  'blue',
  'gray',
  'slate',
  'green',
  'indigo',
  'muted',
  'primary',
  'red',
  'secondary',
  'sky',
] as const
export type ThemeColor = typeof ThemeColors[number]

export type HexColorLiteral = `#${string}`

export type ColorLiteral = HexColorLiteral

export type Color = LiteralUnion<ThemeColor, string>

export type ShapeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * For padding, margin, etc.
 */
export type SpacingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export function isThemeColor(color: Color): color is ThemeColor {
  return color in ThemeColors
}

export interface ElementThemeColorValues {
  fill: ColorLiteral
  stroke: ColorLiteral
  // Main text (title, etc.)
  hiContrast: ColorLiteral
  // Secondary text (description, etc.)
  loContrast: ColorLiteral
}

export type ElementThemeColors = {
  [key in ThemeColor]: ElementThemeColorValues
}

export interface RelationshipThemeColorValues {
  lineColor: ColorLiteral
  labelBgColor: ColorLiteral
  labelColor: ColorLiteral
}

export interface ThemeColorValues {
  elements: ElementThemeColorValues
  relationships: RelationshipThemeColorValues
}

export type RelationshipThemeColors = {
  [key in ThemeColor]: RelationshipThemeColorValues
}

export interface LikeC4Theme {
  font: 'Arial'
  shadow: ColorLiteral
  relationships: RelationshipThemeColors
  elements: ElementThemeColors
  sizes: {
    [key in ShapeSize]: {
      width: number
      height: number
    }
  }
  spacing: {
    [key in SpacingSize]: number
  }
  textSizes: {
    [key in TextSize]: number
  }
}
