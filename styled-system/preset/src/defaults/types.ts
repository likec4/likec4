import {
  amber,
  blue,
  crimson,
  grass,
  indigo,
  lime,
  orange,
  pink,
  purple,
  red,
  ruby,
  teal,
  tomato,
  violet,
  yellow,
} from '@radix-ui/colors'

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
  'component',
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

export const DefaultTagColorValues = {
  tomato: tomato.tomato9,
  grass: grass.grass9,
  blue: blue.blue9,
  ruby: ruby.ruby9,
  orange: orange.orange9,
  indigo: indigo.indigo9,
  pink: pink.pink9,
  teal: teal.teal9,
  purple: purple.purple9,
  amber: amber.amber9,
  crimson: crimson.crimson9,
  red: red.red9,
  lime: lime.lime9,
  yellow: yellow.yellow9,
  violet: violet.violet9,
} as const

export function isDefaultTagColor(color: string): color is keyof typeof DefaultTagColorValues {
  return color in DefaultTagColorValues
}
