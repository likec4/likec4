export const Sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const
export type Size = typeof Sizes[number]
export type TextSize = Size
export type ShapeSize = Size
export type SpacingSize = Size
export type IconSize = Size

export const IconPositions = ['left', 'right', 'top', 'bottom'] as const
export type IconPosition = typeof IconPositions[number]

export const BorderStyles = ['solid', 'dashed', 'dotted', 'none'] as const
export type BorderStyle = typeof BorderStyles[number]

export const ElementShapes = [
  'rectangle',
  'person',
  'browser',
  'mobile',
  'cylinder',
  'storage',
  'queue',
  'bucket',
  'document',
] as const

export type ElementShape = typeof ElementShapes[number]

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

export type Color = `#${string}`

export interface ElementColorValues {
  readonly fill: Color
  readonly stroke: Color
  // Main text (title, etc.)
  readonly hiContrast: Color
  // Secondary text (description, etc.)
  readonly loContrast: Color
}

export interface RelationshipColorValues {
  readonly line: Color
  readonly labelBg: Color
  readonly label: Color
}

export interface ThemeColorValues {
  readonly elements: ElementColorValues
  readonly relationships: RelationshipColorValues
}

export interface LikeC4Theme {
  readonly colors: Readonly<Record<ThemeColor, ThemeColorValues>>
  readonly sizes: Readonly<
    Record<ShapeSize, {
      readonly width: number
      readonly height: number
    }>
  >
  readonly spacing: Readonly<Record<SpacingSize, number>>
  readonly textSizes: Readonly<Record<TextSize, number>>
  readonly iconSizes: Readonly<Record<IconSize, number>>
}

export const DefaultTagColors = [
  'tomato',
  'grass',
  'blue',
  'ruby',
  'orange',
  'indigo',
  'pink',
  'teal',
  'purple',
  'amber',
  'crimson',
  'red',
  'lime',
  'yellow',
  'violet',
] as const
