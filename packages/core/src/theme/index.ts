import chroma from 'chroma-js';
import type { ColorLiteral, HexColor, LikeC4Theme, ThemeColorValues } from '../types'
import { ElementColors } from './element'
import { RelationshipColors } from './relationships'
import { isDeepEqual } from 'remeda'

const CONTRAST_MIN_WITH_FOREGROUND = 60
const CONTRAST_START_TONE_DIFFERENCE = 2
const CONTRAST_STEP_TONE_DIFFERENCE = 1
const CONTRAST_LOW_HIGH_TONE_DIFFERENCE = 0.4
const SECONDARY_TONE_DIFFERENCE = 0.8
const LIGHT_DARK_TONE_DIFFERENCE = 1

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
  main: ColorLiteral,
  secondary: ColorLiteral,
  hiContrast: ColorLiteral,
  loContrast: ColorLiteral,
  light: ColorLiteral,
  dark: ColorLiteral,
}

export function computeColorValues(color: ColorLiteral): ThemeColorValues {
  if (color.match(/^#([0-9a-f]{3}){1,2}$/i)) {
    const colors = getColorPalette(color)

    return {
      elements: {
        fill: colors.main,
        stroke: colors.secondary,
        hiContrast: colors.hiContrast,
        loContrast: colors.loContrast,
      	light: colors.light,
      	dark: colors.dark,
      },
      relationships: {
        lineColorLight: colors.light,
        lineColorDark: colors.dark,
        labelColor: colors.hiContrast,
        labelBgColor: colors.main,
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
  // main color is the one choosen by the user
  const main = refColor as HexColor
  const mainChroma = chroma(main)
  const secondary = mainChroma.darken(SECONDARY_TONE_DIFFERENCE).hex() as HexColor
  const contrastedColor = getContrastedColorsAPCA(main)
  const hiContrast = contrastedColor[0] as HexColor
  const loContrast = contrastedColor[1] as HexColor
  
  // Define light and dark value in the same tone. It could to be used by light and 
  // dark theme when readability is affected (when using transparency for example)
  let light
  let dark
  const mainLuminance = mainChroma.luminance()
  // If the main color is pretty light
  if (mainLuminance > 0.6) {
    light = main
    dark = mainChroma.darken(LIGHT_DARK_TONE_DIFFERENCE).hex() as HexColor
  // If the main color is pretty dark
  } else if (mainLuminance < 0.4){
    light = mainChroma.brighten(LIGHT_DARK_TONE_DIFFERENCE).hex() as HexColor
    dark = main
  // If the main color is neither dark or dark
  } else {
    light = mainChroma.brighten(LIGHT_DARK_TONE_DIFFERENCE).hex() as HexColor
    dark = mainChroma.darken(LIGHT_DARK_TONE_DIFFERENCE).hex() as HexColor
  }
  
  return { main, secondary, hiContrast, loContrast, light, dark }
}

/**
 * Find the best contrasted color for the color passed as argument. Return one "low contrast" color matching the 
 * CONTRAST_MIN_WITH_FOREGROUND APCA value and one more contrasted color derivated of CONTRAST_LOW_HIGH_TONE_DIFFERENCE step from the "low contrast" color
 * 
 * @returns a tuple where the first element is the most contrasted and the second is the less contrasted
 */
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
    return [lightColorRgb.brighten(CONTRAST_LOW_HIGH_TONE_DIFFERENCE).hex(), lightColorRgb.hex()]
  } else {
    return [darkColorRgb.darken(CONTRAST_LOW_HIGH_TONE_DIFFERENCE).hex(), darkColorRgb.hex()]
  }
}
export { ElementColors, RelationshipColors }
