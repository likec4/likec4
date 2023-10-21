export type ThemeColor =
  | 'amber'
  | 'blue'
  | 'gray'
  | 'slate'
  | 'green'
  | 'indigo'
  | 'muted'
  | 'primary'
  | 'red'
  | 'secondary'
  | 'sky'

export type HexColorLiteral = `#${string}`

export type ColorLiteral = HexColorLiteral

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

export type RelationshipThemeColors = {
  [key in ThemeColor]: RelationshipThemeColorValues
}

export interface LikeC4Theme {
  font: 'Helvetica' // for now only support Helvetica
  shadow: ColorLiteral
  relationships: RelationshipThemeColors
  elements: ElementThemeColors
}
