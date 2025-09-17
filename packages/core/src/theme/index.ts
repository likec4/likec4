import { generateColors } from '@mantine/colors-generator'
import chroma from 'chroma-js'
import { fromKeys, isDeepEqual } from 'remeda'
import {
  type ColorLiteral,
  type DefaultStyleValues,
  type HexColor,
  type LikeC4Theme,
  type ThemeColorValues,
  ThemeColors,
} from '../types/styles'
import { ElementColors } from './element'
import { RelationshipColors } from './relationships'

const CONTRAST_MIN_WITH_FOREGROUND = 60
const CONTRAST_START_TONE_DIFFERENCE = 2
const CONTRAST_STEP_TONE_DIFFERENCE = 1

export const defaultStyles: DefaultStyleValues = {
  color: 'primary',
  size: 'md',
  element: {
    shape: 'rectangle',
    color: 'primary',
    opacity: 100,
    border: 'solid',
    size: 'md',
  },
  group: {
    color: 'primary',
    opacity: 20,
    border: 'dashed',
  },
  relationship: {
    color: 'gray',
    line: 'dashed',
    arrow: 'normal',
  },
}

export const defaultTheme: LikeC4Theme = {
  elements: ElementColors,
  relationships: RelationshipColors,
  font: 'Arial',
  shadow: '#0a0a0a',
  colors: fromKeys(ThemeColors, (key) => ({
    elements: ElementColors[key],
    relationships: RelationshipColors[key],
  })),
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

export function computeColorValues(color: ColorLiteral): ThemeColorValues {
  if (color.match(/^#([0-9a-f]{3}){1,2}$/i)) {
    const colors = generateColors(color)

    const fillColor = colors[6]
    const contrastedColors = getContrastedColorsAPCA(fillColor)

    return {
      elements: {
        fill: fillColor as HexColor,
        stroke: colors[7] as HexColor,
        hiContrast: contrastedColors[0] as HexColor,
        loContrast: contrastedColors[1] as HexColor,
      },
      relationships: {
        line: colors[4] as HexColor,
        label: colors[3] as HexColor,
        labelBg: colors[9] as HexColor,
      },
    }
  } else {
    return defaultTheme.colors.primary
  }
}

function getContrastedColorsAPCA(refColor: string): [string, string] {
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
    return [lightColorRgb.brighten(0.4).hex(), lightColorRgb.hex()]
  } else {
    return [darkColorRgb.darken(0.4).hex(), darkColorRgb.hex()]
  }
}

export { ElementColors, RelationshipColors }
