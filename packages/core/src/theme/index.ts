import chroma from 'chroma-js';
import type { ColorLiteral, HexColor, LikeC4Theme, ThemeColorValues } from '../types'
import { ElementColors } from './element'
import { RelationshipColors } from './relationships'
import { isDeepEqual } from 'remeda'
import { adjustToneRgb, adjustToneHex } from '../utils/color'

const MIN_CONTRAST_WITH_FOREGROUND = 80

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
  const el_contrastedColor = getContrastedColorAPCA(el_main)
  const el_hiContrast = el_contrastedColor[0] as HexColor
  const el_loContrast = el_contrastedColor[1] as HexColor
  
  // Define light and dark value in the same tone. It could to be used by light and 
  // dark theme when readability is affected (when using transparency for example)
  let el_light
  let el_dark
  const el_mainLuminance = (chroma(el_main)).luminance()
  if (el_mainLuminance > 0.7) {
    el_light = el_main
    el_dark = el_hiContrast
  } else if (el_mainLuminance < 0.3){
    el_light = el_hiContrast
    el_dark = el_main
  } else {
    el_light = chroma(el_main).brighten(0.8).hex() as HexColor
    el_dark = el_secondary
  }
  
  
  const rel_light = adjustToneHex(el_main, 0.25) as HexColor
  const rel_dark = adjustToneHex(el_main, -0.25) as HexColor
  const rel_secondary = adjustToneHex(el_main, -0.25) as HexColor
  const rel_contrastedColor = getContrastedColorAPCA(el_main)
  const rel_hiContrast = rel_contrastedColor[0] as HexColor

  return { el_main, el_secondary, el_hiContrast, el_loContrast, el_light, el_dark, rel_light, rel_dark, rel_secondary, rel_hiContrast }
}

function getContrastedColorAPCA(refColor: string): [string, string] {

  const refColorChroma = chroma(refColor)

  // Start with 30% tone difference from reference
  let lightColorRgb = refColorChroma.brighten(2);
  let darkColorRgb = refColorChroma.darken(2);

  let contrastWithLight
  let previousLight
  let contrastWithDark
  let previousDark
  do {
    // Store previous colors for loop condition
    previousLight = lightColorRgb
    previousDark = darkColorRgb

    // Change tone by 10% each loop
    lightColorRgb = lightColorRgb.brighten(1)
    darkColorRgb = darkColorRgb.darken(1)

    // Calculate contrast of each color with the reference color
    contrastWithLight = chroma.contrastAPCA(refColorChroma, lightColorRgb);
    contrastWithDark = chroma.contrastAPCA(refColorChroma, darkColorRgb);
  }
  // Stop if one of the contrast is high enough or if we reach max value for each (when they are equal between two rounds)
  while (Math.abs(contrastWithLight) < MIN_CONTRAST_WITH_FOREGROUND
    && Math.abs(contrastWithDark) < MIN_CONTRAST_WITH_FOREGROUND
    && (!isDeepEqual(lightColorRgb, previousLight) || !isDeepEqual(darkColorRgb, previousDark)))

  // Choose the max contrast between the two
  if (Math.abs(contrastWithLight) > Math.abs(contrastWithDark)) {
    return [lightColorRgb.hex(), lightColorRgb.darken(0.4).hex()]
  } else {
    return [darkColorRgb.hex(), darkColorRgb.brighten(0.4).hex()]
  }
}

export { ElementColors, RelationshipColors }
