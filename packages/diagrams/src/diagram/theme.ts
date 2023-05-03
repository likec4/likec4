import colors from 'tailwindcss/colors'
import type { DiagramTheme } from './types'

const shadow = '#0a0a0a'

export const DefaultDiagramTheme: DiagramTheme = {
  font: 'Helvetica',
  relation: {
    lineColor: colors.neutral[400],
    labelColor: colors.neutral[200],
  },
  colors: {
    primary: {
      shadow,
      // fill: '#2563eb',
      // stroke: darken('#2563eb', 11),
      // stroke: '#1e40af',
      fill: colors.blue[500],
      stroke: colors.blue[600],
      hiContrast: colors.blue[50],
      loContrast: colors.blue[100],
    },
    // secondary: mkThemeColors('#5373E7'),
    // secondary: {
    //   shadow,
    //   fill: '#4338ca',
    //   stroke: '#312e81',
    //   hiContrast: '#eef2ff',
    //   loContrast: '#a5b4fc'
    // },
    secondary: {
      shadow,
      // fill: '#0369a1',
      // // stroke: '#0c4a6e',
      // stroke: darken('#0369a1', 10),
      // hiContrast: '#f0f9ff',
      // loContrast: '#bae6fd'
      fill: colors.sky[600],
      stroke: colors.sky[700],
      hiContrast: colors.sky[50],
      loContrast: colors.sky[100],
    },
    muted: {
      shadow,
      fill: colors.slate[500],
      stroke: colors.slate[600],
      hiContrast: colors.slate[50],
      loContrast: colors.slate[200],
    }
  }
}
