import { generateColors } from '@mantine/colors-generator'
import chroma from 'chroma-js'
import { isDeepEqual } from 'remeda'
import { invariant } from '../utils'
import type { ColorLiteral, HexColor, ThemeColorValues } from './types'

const CONTRAST_MIN_WITH_FOREGROUND = 60
const CONTRAST_START_TONE_DIFFERENCE = 2
const CONTRAST_STEP_TONE_DIFFERENCE = 1

export function computeColorValues(color: ColorLiteral): ThemeColorValues {
  invariant(chroma.valid(color), `Invalid color: ${color}`)
  const colors = generateColors(color)

  const fillColor = colors[6]
  const contrastedColors = getContrastedColorsAPCA(fillColor)

  return {
    elements: {
      fill: fillColor as HexColor,
      stroke: colors[7] as HexColor,
      ...contrastedColors,
    },
    relationships: {
      line: colors[4] as HexColor,
      label: colors[3] as HexColor,
      labelBg: colors[9] as HexColor,
    },
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
