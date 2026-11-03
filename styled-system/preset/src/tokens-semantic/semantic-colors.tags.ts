import type { SemanticToken, TokenDataTypes } from '@pandacss/types'
import {
  amber,
  amberDark,
  blue,
  blueDark,
  crimson,
  crimsonDark,
  grass,
  grassDark,
  indigo,
  indigoDark,
  lime,
  limeDark,
  orange,
  orangeDark,
  pink,
  pinkDark,
  purple,
  purpleDark,
  red,
  redDark,
  ruby,
  rubyDark,
  teal,
  tealDark,
  tomato,
  tomatoDark,
  violet,
  violetDark,
  yellow,
  yellowDark,
} from '@radix-ui/colors'
import type { DefaultTagColors } from '../defaults/types.ts'
import { value } from './value.ts'

type ColorToken = SemanticToken<TokenDataTypes['colors'], 'base' | '_dark'>

/**
 * Semantic tokens of a default tag color.
 * Mirrors the shape of `likec4.tag` (bg, bg.hover, border, text).
 */
export type TagColorTokens = {
  bg: {
    DEFAULT: ColorToken
    hover: ColorToken
  }
  border: ColorToken
  text: ColorToken
}

/**
 * Radix grades used by tags
 */
type Grade = 8 | 9 | 10 | 12

type RadixScale<N extends string> = {
  [key in `${N}${Grade}`]: string
}

/**
 * Colors that are light at radix grade 9 and need dark text in both color modes.
 */
const withDarkText: ReadonlySet<string> = new Set<DefaultTagColors>(['grass', 'lime', 'yellow', 'amber'])

function tagColorTokens<N extends DefaultTagColors>(
  name: N,
  light: RadixScale<N>,
  dark: RadixScale<N>,
): TagColorTokens {
  const grade = (g: Grade) => value(light[`${name}${g}`], dark[`${name}${g}`])
  return {
    bg: {
      DEFAULT: grade(9),
      hover: grade(10),
    },
    border: grade(8),
    text: withDarkText.has(name) ? value('rgba(0 0 0 / 0.85)') : grade(12),
  }
}

/**
 * Semantic tokens for default tag colors, spread into `likec4.tag`:
 * `likec4.tag.<color>.bg`, `likec4.tag.<color>.bg.hover`, `likec4.tag.<color>.border`, `likec4.tag.<color>.text`
 */
export const tagColors = {
  tomato: tagColorTokens('tomato', tomato, tomatoDark),
  grass: tagColorTokens('grass', grass, grassDark),
  blue: tagColorTokens('blue', blue, blueDark),
  ruby: tagColorTokens('ruby', ruby, rubyDark),
  orange: tagColorTokens('orange', orange, orangeDark),
  indigo: tagColorTokens('indigo', indigo, indigoDark),
  pink: tagColorTokens('pink', pink, pinkDark),
  teal: tagColorTokens('teal', teal, tealDark),
  purple: tagColorTokens('purple', purple, purpleDark),
  amber: tagColorTokens('amber', amber, amberDark),
  crimson: tagColorTokens('crimson', crimson, crimsonDark),
  red: tagColorTokens('red', red, redDark),
  lime: tagColorTokens('lime', lime, limeDark),
  yellow: tagColorTokens('yellow', yellow, yellowDark),
  violet: tagColorTokens('violet', violet, violetDark),
} satisfies Record<DefaultTagColors, TagColorTokens>
