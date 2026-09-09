import { defineTokens } from '@pandacss/dev'
import { mapToObj } from 'remeda'
import { defaultMantineColors } from '../generated'
import { type Shades, ramp } from '../helpers'

/**
 * The LikeC4 accent, derived from the logo mark.
 *
 * The mark is `#5E98AF` — hue 197, 34% saturation — and sits at index 4, the
 * middle of the ramp. Mantine fills from index 6 and hovers from index 7, so
 * those are darkened into contrast range: `#34748d` carries white text at
 * 5.2:1, where the mark itself manages only 3.2:1. Dark mode moves *up* the
 * ramp (index 3) rather than down.
 */
const likec4Accent = ramp([
  '#eff7fa',
  '#ddedf4',
  '#bcdae6',
  '#97c2d3',
  '#5e98af',
  '#4587a1',
  '#34748d',
  '#2a637a',
  '#205165',
  '#184253',
])

function createMantineColors<T extends string>(
  name: T,
  shades: Shades,
): Record<`${T}[${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}]`, { description: string; value: string }> {
  return mapToObj(shades, (color, idx) => [
    `${name}[${idx}]`,
    {
      description: `Mantine color ${name}.${idx}`,
      value: color,
    },
  ])
}

export const colors = defineTokens.colors({
  mantine: {
    ...createMantineColors('gray', defaultMantineColors.gray),
    ...createMantineColors('dark', defaultMantineColors.dark),
    ...createMantineColors('orange', defaultMantineColors.orange),
    ...createMantineColors('yellow', defaultMantineColors.yellow),
  },
  // mantine: generated.colors.mantine,
  // For typesafety, otherwise wrap with []
  transparent: { value: 'transparent' },
  // For fill: none
  none: { value: 'none' },
  inherit: { value: 'inherit' },
  current: { value: 'current' },
  currentColor: { value: 'currentColor' },
  white: { value: '#fff' },
  black: { value: '#000' },
  likec4: {
    accent: {
      DEFAULT: likec4Accent[6],
      ...likec4Accent,
    },
  },
})
