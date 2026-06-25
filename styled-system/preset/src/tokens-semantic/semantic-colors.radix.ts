import { defineSemanticTokens } from '@pandacss/dev'
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
  slate,
  slateDark,
  teal,
  tealDark,
  tomato,
  tomatoDark,
  violet,
  violetDark,
  yellow,
  yellowDark,
} from '@radix-ui/colors'

import type { SemanticToken } from '@pandacss/types'
import { fromEntries, fromKeys } from 'remeda'
import { DefaultTagColors } from '../defaults/types.ts'

const radixGrades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

type Grade = `${typeof radixGrades[number]}`

export interface RadixGradeToken extends SemanticToken<string, 'base' | '_dark'> {
}

export type RadixGrades = {
  [grade in Grade]: RadixGradeToken
}

export type RadixColor<N extends string> = {
  [key in `${N}${Grade}`]: string
}

function generateRadixColor<N extends string>(
  name: N,
  light: RadixColor<N>,
  dark: RadixColor<N>,
): readonly [N, RadixGrades] {
  return [
    name,
    fromKeys(radixGrades, (grade): RadixGradeToken => ({
      value: {
        base: light[`${name}${grade}`],
        _dark: dark[`${name}${grade}`],
      },
    })),
  ]
}

export const radixColors = defineSemanticTokens.colors(
  fromEntries([
    generateRadixColor('amber', amber, amberDark),
    generateRadixColor('blue', blue, blueDark),
    generateRadixColor('crimson', crimson, crimsonDark),
    generateRadixColor('grass', grass, grassDark),
    generateRadixColor('indigo', indigo, indigoDark),
    generateRadixColor('lime', lime, limeDark),
    generateRadixColor('orange', orange, orangeDark),
    generateRadixColor('pink', pink, pinkDark),
    generateRadixColor('purple', purple, purpleDark),
    generateRadixColor('red', red, redDark),
    generateRadixColor('ruby', ruby, rubyDark),
    generateRadixColor('teal', teal, tealDark),
    generateRadixColor('tomato', tomato, tomatoDark),
    generateRadixColor('violet', violet, violetDark),
    generateRadixColor('yellow', yellow, yellowDark),
  ]),
) satisfies {
  [key in DefaultTagColors]: RadixGrades
}
