import { generateColors } from '@mantine/colors-generator'
import type { ColorLiteral, LikeC4Theme, ThemeColorValues } from '../types'
import { ElementColors } from './element'
import { RelationshipColors } from './relationships'

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
  textSizes: {
    xs: 12,
    sm: 14,
    md: 19,
    lg: 24,
    xl: 32,
  },
}

export function computeColorValues(color: ColorLiteral): ThemeColorValues {
  if (color.match(/^#([0-9a-f]{3}){1,2}$/i)) {
    const colors = generateColors(color)

    return {
      elements: {
        fill: colors[6] as ColorLiteral,
        stroke: colors[7] as ColorLiteral,
        hiContrast: colors[0] as ColorLiteral,
        loContrast: colors[1] as ColorLiteral,
      },
      relationships: {
        lineColor: colors[4] as ColorLiteral,
        labelColor: colors[3] as ColorLiteral,
        labelBgColor: colors[9] as ColorLiteral,
      },
    }
  } else {
    return {
      elements: defaultTheme.elements['primary'],
      relationships: defaultTheme.relationships['primary'],
    }
  }
}

export { ElementColors, RelationshipColors }
