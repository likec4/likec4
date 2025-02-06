import { generateColors } from '@mantine/colors-generator'
import type { HexColorLiteral, LikeC4Theme, ThemeColorValues } from '../types/theme'
import { ElementColors } from './element'
import { RelationshipColors } from './relationships'

export const defaultTheme: LikeC4Theme = {
  elements: ElementColors,
  relationships: RelationshipColors,
  font: 'Arial',
  shadow: '#0a0a0a',
  sizes: {
    xs: {
      width: 120,
      height: 80,
    },
    sm: {
      width: 180,
      height: 110,
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
    md: 24, // 1.5rem = 16px + 8px
    lg: 32, // 2rem
    xl: 48,
  },
  textSizes: {
    xs: 12,
    sm: 14,
    md: 19,
    lg: 24,
    xl: 32,
  },
}

export function computeColorValues(color: HexColorLiteral): ThemeColorValues {
  if (color.match(/^#([0-9a-f]{3}){1,2}$/i)) {
    const colors = generateColors(color)

    return {
      elements: {
        fill: colors[6] as HexColorLiteral,
        stroke: colors[7] as HexColorLiteral,
        hiContrast: colors[0] as HexColorLiteral,
        loContrast: colors[1] as HexColorLiteral,
      },
      relationships: {
        lineColor: colors[4] as HexColorLiteral,
        labelColor: colors[3] as HexColorLiteral,
        labelBgColor: colors[9] as HexColorLiteral,
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
