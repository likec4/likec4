import { DefaultTagColors } from './generated'

export const root = '.likec4-root'
export const rootNotReduced = `${root}:not([data-likec4-reduced-graphics])`

export const nodeOrEdge = `:where(.react-flow__node, .react-flow__edge, .likec4-edge-label-container)`

/**
 * Copy from pandacss-preset-radix-colors (type not exported)
 *
 * @see https://github.com/muijf/pandacss-preset-radix-colors
 */
const AllRadixColors = [
  'amber',
  'black',
  'blue',
  'bronze',
  'brown',
  'crimson',
  'cyan',
  'gold',
  'grass',
  'gray',
  'green',
  'indigo',
  'iris',
  'jade',
  'lime',
  'mauve',
  'mint',
  'olive',
  'orange',
  'pink',
  'plum',
  'purple',
  'red',
  'ruby',
  'sage',
  'sand',
  'sky',
  'slate',
  'teal',
  'tomato',
  'violet',
  'white',
  'yellow',
] as const
export type RadixColor = (typeof AllRadixColors)[number]

export const radixColors = [...DefaultTagColors] satisfies RadixColor[]

export const iconSize = '--likec4-icon-size'
