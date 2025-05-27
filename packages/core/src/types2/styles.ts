import type { TupleToUnion } from 'type-fest'

/**
 * For padding, margin, etc.
 */
export type SpacingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type ShapeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export const BorderStyles = ['solid', 'dashed', 'dotted', 'none'] as const

export type BorderStyle = TupleToUnion<typeof BorderStyles>

export const ElementShapes = [
  'rectangle',
  'person',
  'browser',
  'mobile',
  'cylinder',
  'storage',
  'queue',
] as const

export type ElementShape = TupleToUnion<typeof ElementShapes>

type Comma = ',' | ', '
export type ColorLiteral =
  | `#${string}`
  | `rgb(${number}${Comma}${number}${Comma}${number})`
  | `rgba(${number}${Comma}${number}${Comma}${number}${Comma}${number})`

export type RelationshipLineType = 'dashed' | 'solid' | 'dotted'

// reference: https://graphviz.org/docs/attr-types/arrowType/
export type RelationshipArrowType =
  | 'none'
  | 'normal'
  | 'onormal'
  | 'dot'
  | 'odot'
  | 'diamond'
  | 'odiamond'
  | 'crow'
  | 'open'
  | 'vee'

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

export function isThemeColor(color: string): color is ThemeColor {
  return ThemeColors.includes(color as ThemeColor)
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
