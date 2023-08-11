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

export interface ThemeColorValues {
  fill: ColorLiteral
  stroke: ColorLiteral
  // Main text (title, etc.)
  hiContrast: ColorLiteral
  // Secondary text (description, etc.)
  loContrast: ColorLiteral
}

export type ThemeColors = {
  [key in ThemeColor]: ThemeColorValues
}

export interface ThemeRelationColors {
  lineColor: ColorLiteral
  labelColor: ColorLiteral
}

export interface LikeC4Theme {
  font: 'Helvetica' // for now only support Helvetica
  shadow: ColorLiteral
  relation: ThemeRelationColors
  colors: ThemeColors
}
