import type {
  HexColorLiteral,
  LikeC4Theme,
  ThemeColorValues,
} from '../types/theme'
import { ElementColors } from './element'
import { RelationshipColors } from './relationships'
import { generate } from '@ant-design/colors'

export const defaultTheme = {
  elements: ElementColors,
  relationships: RelationshipColors,
  font: 'Arial',
  shadow: '#0a0a0a'
} satisfies LikeC4Theme

export function computeColorValues(color: HexColorLiteral): ThemeColorValues {
  const colors = generate(color)

  return {
    elements: {
      fill: color,
      stroke: colors[6] as HexColorLiteral,
      hiContrast: colors[1] as HexColorLiteral,
      loContrast: colors[2] as HexColorLiteral
    },
    relationships: {
      lineColor: color,
      labelColor: colors[4] as HexColorLiteral,
      labelBgColor: colors[9] as HexColorLiteral
    }
  }
}

export { ElementColors, RelationshipColors }
