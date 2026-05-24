import { defineTokens } from '@pandacss/dev'
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
import { DefaultTagColors } from '../defaults/types.ts'
import { tokens as generated } from '../generated.ts'

const RADIX_COLORS = {
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
  amberDark,
  blueDark,
  crimsonDark,
  grassDark,
  indigoDark,
  limeDark,
  orangeDark,
  pinkDark,
  purpleDark,
  redDark,
  rubyDark,
  tealDark,
  tomatoDark,
  violetDark,
  yellowDark,
} as const satisfies Record<DefaultTagColors | `${DefaultTagColors}Dark`, Record<string, string>>

type RadixColorLightDarkTokens = {
  [key in 'light' | 'dark']: {
    [key in '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12']: { value: string }
  }
}

function generateRadixColorToken(name: DefaultTagColors): RadixColorLightDarkTokens {
  return {
    light: Object.fromEntries(
      Object.entries(RADIX_COLORS[name]).map(([, value], index) => [`${index + 1}`, { value }]),
    ) as unknown as RadixColorLightDarkTokens['light'],
    dark: Object.fromEntries(
      Object.entries(RADIX_COLORS[`${name}Dark`]).map(([, value], index) => [
        `${index + 1}`,
        { value },
      ]),
    ) as unknown as RadixColorLightDarkTokens['dark'],
  }
}

export const radixColors = defineTokens.colors(
  DefaultTagColors.reduce(
    (acc, color) => {
      acc[color] = generateRadixColorToken(color)
      return acc
    },
    {} as Record<DefaultTagColors, RadixColorLightDarkTokens>,
  ),
)
