import type { MergeExclusive, Simplify, Tagged, TupleToUnion } from 'type-fest'

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

export type HexColor = `#${string}`

export type ColorLiteral =
  | HexColor
  | `rgb(${number},${number},${number})`
  | `rgba(${number},${number},${number},${number})`

export type CustomColor<T = string> = Tagged<T, 'CustomColor'>

export type CustomColorDefinitions = { [key: string]: ThemeColorValues }

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

/**
 * Backward compatibility alias
 * @deprecated Use {@link ThemeColor} instead
 */
export type Color = ThemeColor | ColorLiteral | CustomColor

export function isThemeColor(color: string): color is ThemeColor {
  return ThemeColors.includes(color as any)
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

export type RelationshipThemeColorValues = Simplify<
  MergeExclusive<{
    line: ColorLiteral
    labelBg: ColorLiteral
    label: ColorLiteral
  }, {
    // Backward compatibility
    lineColor: ColorLiteral
    labelBgColor: ColorLiteral
    labelColor: ColorLiteral
  }>
>

export interface ThemeColorValues {
  elements: ElementThemeColorValues
  relationships: RelationshipThemeColorValues
}

export type RelationshipThemeColors = {
  [key in ThemeColor]: RelationshipThemeColorValues
}

export interface DefaultStyleValues {
  color: ThemeColor
  size: ShapeSize
  element: {
    shape: ElementShape
    opacity: number
    border: BorderStyle
    color: ThemeColor
    size: ShapeSize
    padding?: SpacingSize
    text?: TextSize
  }
  group: {
    color: ThemeColor
    opacity: number
    border: BorderStyle
  }
  relationship: {
    color: ThemeColor
    line: RelationshipLineType
    arrow: RelationshipArrowType
  }
}

export interface LikeC4Theme {
  font: 'Arial'
  shadow: ColorLiteral
  /**
   * @deprecated Use {@link colors} instead
   */
  relationships: RelationshipThemeColors
  /**
   * @deprecated Use {@link colors} instead
   */
  elements: ElementThemeColors

  colors: {
    [key in ThemeColor]: ThemeColorValues
  }

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
