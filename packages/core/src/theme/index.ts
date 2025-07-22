import chroma from 'chroma-js';
import type { ColorLiteral, HexColor, LikeC4Theme, ThemeColorValues } from '../types'
import { ElementColors } from './element'
import { RelationshipColors } from './relationships'
import { isDeepEqual } from 'remeda'

const CONTRAST_MIN_WITH_FOREGROUND = 60
const CONTRAST_START_TONE_DIFFERENCE = 2
const CONTRAST_STEP_TONE_DIFFERENCE = 1

export const defaultTheme: LikeC4Theme = {
  elements: ElementColors,
  relationships: RelationshipColors,
  font: 'Arial',
  shadow: '#0a0a0a',
  sizes: {
    xs: {
      width: 180,
      height: 100,
    },
    sm: {
      width: 240,
      height: 135,
    },
    md: {
      width: 320,
      height: 180,
    },
    lg: {
      width: 420,
      height: 234,
    },
    xl: {
      width: 520,
      height: 290,
    },
  },
  spacing: {
    xs: 8, // 0.5rem
    sm: 10, // 0.625rem
    md: 16, // 1rem
    lg: 24, // 1.5rem = 16px + 8px
    xl: 32, // 2rem
  },
  /**
   * Text sizes for titles
   * https://typescale.com/
   *
   * Scale:  1.2
   * Base:   16px
   */
  textSizes: {
    xs: 13.33,
    sm: 16,
    md: 19.2,
    lg: 23.04,
    xl: 27.65,
  },
}

type ColorPalette = {
  el_main: ColorLiteral,
  el_secondary: ColorLiteral,
  el_hiContrast: ColorLiteral,
  el_loContrast: ColorLiteral,
  el_light: ColorLiteral,
  el_dark: ColorLiteral,
  rel_light: ColorLiteral,
  rel_dark: ColorLiteral,
  rel_secondary: ColorLiteral,
  rel_hiContrast: ColorLiteral,
}

export function computeColorValues(color: ColorLiteral): ThemeColorValues {
  if (color.match(/^#([0-9a-f]{3}){1,2}$/i)) {
    const colors = getColorPalette(color)

    return {
      elements: {
        fill: colors.el_main,
        stroke: colors.el_secondary,
        hiContrast: colors.el_hiContrast,
        loContrast: colors.el_loContrast,
      	light: colors.el_light,
      	dark: colors.el_dark,
      },
      relationships: {
        lineColor: colors.rel_light,
        labelColor: colors.rel_hiContrast,
        labelBgColor: colors.rel_secondary,
      },
    }
  } else {
    return {
      elements: defaultTheme.elements['primary'],
      relationships: defaultTheme.relationships['primary'],
    }
  }
}

function getColorPalette(refColor: string): ColorPalette {
  const el_main = refColor as HexColor
  const el_secondary = chroma(el_main).darken(0.8).hex() as HexColor
  const el_contrastedColor = getContrastedColorsAPCA(el_main)
  const el_hiContrast = el_contrastedColor[0] as HexColor
  const el_loContrast = el_contrastedColor[1] as HexColor
  
  // Define light and dark value in the same tone. It could to be used by light and 
  // dark theme when readability is affected (when using transparency for example)
  let el_light
  let el_dark
  const el_mainLuminance = (chroma(el_main)).luminance()
  if (el_mainLuminance > 0.6) {
    el_light = el_main
    el_dark = el_hiContrast
  } else if (el_mainLuminance < 0.4){
    el_light = el_hiContrast
    el_dark = el_main
  } else {
    el_light = chroma(el_main).brighten(0.8).hex() as HexColor
    el_dark = el_secondary
  }
  
  const el_main_chroma = chroma(el_main)
  const rel_light = el_main_chroma.brighten(0.25).hex() as HexColor
  const rel_dark = el_main_chroma.darken(0.25).hex() as HexColor
  const rel_secondary = el_main_chroma.darken(0.25).hex() as HexColor
  const rel_contrastedColor = getContrastedColorsAPCA(el_main)
  const rel_hiContrast = rel_contrastedColor[0] as HexColor

  return { el_main, el_secondary, el_hiContrast, el_loContrast, el_light, el_dark, rel_light, rel_dark, rel_secondary, rel_hiContrast }
}

function getContrastedColorsAPCA(refColor: string): [string, string] {
  const refColorChroma = chroma(refColor)

  // Start with 2 steps tone difference in the CIELAB color space from reference
  let lightColorRgb = refColorChroma.brighten(CONTRAST_START_TONE_DIFFERENCE);
  let darkColorRgb = refColorChroma.darken(CONTRAST_START_TONE_DIFFERENCE);

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
    contrastWithLight = chroma.contrastAPCA(refColorChroma, lightColorRgb);
    contrastWithDark = chroma.contrastAPCA(refColorChroma, darkColorRgb);
  }
  // Stop if one of the contrast is high enough or if we reach max value for each (aka when they are equal between two rounds)
  while (Math.abs(contrastWithLight) < CONTRAST_MIN_WITH_FOREGROUND
    && Math.abs(contrastWithDark) < CONTRAST_MIN_WITH_FOREGROUND
    && (!isDeepEqual(lightColorRgb, previousLight) || !isDeepEqual(darkColorRgb, previousDark)))

  // Choose the max contrast between the two
  if (Math.abs(contrastWithLight) > Math.abs(contrastWithDark)) {
    return [lightColorRgb.brighten(0.4).hex(), lightColorRgb.hex()]
  } else {
    return [darkColorRgb.darken(0.4).hex(), darkColorRgb.hex()]
  }
}
export { ElementColors, RelationshipColors }
