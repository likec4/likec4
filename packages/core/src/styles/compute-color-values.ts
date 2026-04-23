import chroma from 'chroma-js'
import { isDeepEqual } from 'remeda'
import { invariant } from '../utils'
import { adjustToneHex } from '../utils/colors'
import type { ColorLiteral, HexColor, ThemeColorValues } from './types'

const CONTRAST_MIN_WITH_FOREGROUND = 60
const CONTRAST_START_TONE_DIFFERENCE = 2
const CONTRAST_STEP_TONE_DIFFERENCE = 1

type ColorPalette = {
  el_main: HexColor
  el_secondary: HexColor
  el_hiContrast: HexColor
  el_loContrast: HexColor
  rel_main: HexColor
  rel_secondary: HexColor
  rel_hiContrast: HexColor
}

export function computeColorValues(color: ColorLiteral): ThemeColorValues {
  invariant(chroma.valid(color), `Invalid color: ${color}`)
  const normalizedRefColor = color.trim()
  const refColor = (
    normalizedRefColor.startsWith('#') ? normalizedRefColor : chroma(normalizedRefColor).hex()
  ) as HexColor

  const colors = getColorPalette(refColor)

  return {
    elements: {
      fill: colors.el_main,
      stroke: colors.el_secondary,
      hiContrast: colors.el_hiContrast,
      loContrast: colors.el_loContrast,
    },
    relationships: {
      line: colors.rel_secondary,
      label: colors.rel_hiContrast,
      labelBg: colors.rel_main,
    },
  }
}

function getColorPalette(refColor: HexColor): ColorPalette {
  const el_main = refColor
  const el_secondary = chroma(el_main).darken(0.8).hex() as HexColor
  const el_contrastedColor = getContrastedColorsAPCA(el_main)
  const el_hiContrast = el_contrastedColor.hiContrast
  const el_loContrast = el_contrastedColor.loContrast

  const rel_main = el_main
  const rel_secondary = adjustToneHex(el_main, -0.25)
  const rel_contrastedColor = getContrastedColorsAPCA(rel_main)
  const rel_hiContrast = rel_contrastedColor.hiContrast

  return {
    el_main,
    el_secondary,
    el_hiContrast,
    el_loContrast,
    rel_main,
    rel_secondary,
    rel_hiContrast,
  }
}

export function getContrastedColorsAPCA(
  refColor: string | chroma.Color,
): { hiContrast: HexColor; loContrast: HexColor } {
  const refColorChroma = chroma(refColor)

  // Start with 2 steps tone difference in the CIELAB color space from reference
  let lightColorRgb = refColorChroma.brighten(CONTRAST_START_TONE_DIFFERENCE)
  let darkColorRgb = refColorChroma.darken(CONTRAST_START_TONE_DIFFERENCE)

  let previousLight
  let previousDark
  let contrastWithLight
  let contrastWithDark
  do {
    // Store previous colors for loop condition
    previousLight = lightColorRgb
    previousDark = darkColorRgb

    // Change tone by 1 step each loop
    lightColorRgb = lightColorRgb.brighten(CONTRAST_STEP_TONE_DIFFERENCE)
    darkColorRgb = darkColorRgb.darken(CONTRAST_STEP_TONE_DIFFERENCE)

    // Calculate contrast of each color with the reference color
    contrastWithLight = chroma.contrastAPCA(refColorChroma, lightColorRgb)
    contrastWithDark = chroma.contrastAPCA(refColorChroma, darkColorRgb)
  }
  while (
    // Stop if one of the contrast is high enough or if we reach max value for each (aka when they are equal between two rounds)
    Math.abs(contrastWithLight) < CONTRAST_MIN_WITH_FOREGROUND
    && Math.abs(contrastWithDark) < CONTRAST_MIN_WITH_FOREGROUND
    && (!isDeepEqual(lightColorRgb, previousLight) || !isDeepEqual(darkColorRgb, previousDark))
  )

  // Choose the max contrast between the two
  if (Math.abs(contrastWithLight) > Math.abs(contrastWithDark)) {
    return {
      hiContrast: chroma(lightColorRgb.brighten(0.4)).hex() as HexColor,
      loContrast: lightColorRgb.hex() as HexColor,
    }
  } else {
    return {
      hiContrast: chroma(darkColorRgb.darken(0.4)).hex() as HexColor,
      loContrast: darkColorRgb.hex() as HexColor,
    }
  }
}
