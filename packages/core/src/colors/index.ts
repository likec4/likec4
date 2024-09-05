import { generateColors } from '@mantine/colors-generator'
import type { HexColorLiteral, LikeC4Theme, ThemeColorValues } from '../types/theme'
import { ElementColors } from './element'
import { RelationshipColors } from './relationships'

export const defaultTheme = {
  elements: ElementColors,
  relationships: RelationshipColors,
  font: 'Arial',
  shadow: '#0a0a0a'
} satisfies LikeC4Theme

export function computeColorValues(color: HexColorLiteral): ThemeColorValues {
  if (color.match(/^#([0-9a-f]{3}){1,2}$/i)) {
    const colors = generateColors(color)

    return {
      elements: {
        fill: colors[6] as HexColorLiteral,
        stroke: colors[7] as HexColorLiteral,
        hiContrast: colors[0] as HexColorLiteral,
        loContrast: colors[1] as HexColorLiteral
      },
      relationships: {
        lineColor: colors[4] as HexColorLiteral,
        labelColor: colors[3] as HexColorLiteral,
        labelBgColor: colors[9] as HexColorLiteral
      }
    }
  } else {
    return {
      elements: defaultTheme.elements['primary'],
      relationships: defaultTheme.relationships['primary']
    }
  }
}

export { ElementColors, RelationshipColors }
