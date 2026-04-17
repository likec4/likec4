import chroma from 'chroma-js'
import { isDeepEqual } from 'remeda'
import { invariant } from '../utils'
import type { ColorLiteral, HexColor, ThemeColorValues } from './types'

const CONTRAST_MIN_WITH_FOREGROUND = 60
const CONTRAST_START_TONE_DIFFERENCE = 2
const CONTRAST_STEP_TONE_DIFFERENCE = 1

type ColorPalette = {
  el_main: ColorLiteral
  el_secondary: ColorLiteral
  el_hiContrast: ColorLiteral
  el_loContrast: ColorLiteral
  rel_main: ColorLiteral
  rel_secondary: ColorLiteral
  rel_hiContrast: ColorLiteral
}

export function computeColorValues(color: ColorLiteral): ThemeColorValues {
  invariant(chroma.valid(color), `Invalid color: ${color}`)
  const colors = getColorPalette(color)

  const fillColor = colors.el_main
  const contrastedColors = getContrastedColorsAPCA(fillColor)

  return {
    elements: {
      fill: fillColor as HexColor,
      stroke: colors.el_secondary as HexColor,
      ...contrastedColors,
    },
    relationships: {
      line: colors.rel_secondary as HexColor,
      label: colors.rel_hiContrast as HexColor,
      labelBg: colors.rel_main as HexColor,
    },
  }
}

function getColorPalette(refColor: string): ColorPalette {
  const el_main = refColor as HexColor
  const el_secondary = chroma(el_main).darken(0.8).hex() as HexColor
  const el_contrastedColor = getContrastedColorsAPCA(el_main)
  const el_hiContrast = el_contrastedColor.hiContrast as HexColor
  const el_loContrast = el_contrastedColor.loContrast as HexColor

  const rel_main = el_main as HexColor
  const rel_secondary = adjustToneHex(el_main, -0.25) as HexColor
  const rel_contrastedColor = getContrastedColorsAPCA(el_main)
  const rel_hiContrast = rel_contrastedColor.hiContrast as HexColor

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
      hiContrast: lightColorRgb.brighten(0.4).hex() as HexColor,
      loContrast: lightColorRgb.hex() as HexColor,
    }
  } else {
    return {
      hiContrast: darkColorRgb.darken(0.4).hex() as HexColor,
      loContrast: darkColorRgb.hex() as HexColor,
    }
  }
}

export function adjustToneRgb(rgb: [number, number, number], factor: number): [number, number, number] {
  // Clamp factor to range [-1, 1]
  factor = Math.max(-1, Math.min(1, factor))

  return rgb.map(channel => {
    const adjusted = factor > 0
      ? channel + (255 - channel) * factor // lighten
      : channel * (1 + factor) // darken
    // return a value between 0 and 255
    return Math.round(Math.max(0, Math.min(255, adjusted)))
  }) as [number, number, number]
}

export function adjustToneHex(hex: string, factor: number): string {
  return chroma(adjustToneRgb(chroma(hex).rgb(), factor)).hex()
}
