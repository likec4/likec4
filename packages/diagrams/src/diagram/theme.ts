import { complement, invert } from 'khroma'
import type { DiagramTheme, ThemeColors } from './types'

const shadow = '#0a0a0a'

// {
//   "font": "Helvetica",
//   "relation": {
//     "lineColor": "#889096",
//     "labelColor": "#D7DBDF"
//   },
//   "colors": {
//     "primary": {
//       "shadow": "#1A1D1E",
//       fill: "#3E63DD",
//       "stroke": "#5373E7",
//       "hiContrast": "#EEF1FD",
//       "loContrast": "#AEC0F5"
//     },
//     "secondary": {
//       "shadow": "#1A1D1E",
//       fill: "#5373E7",
//       "stroke": "#2F4EB2",
//       "hiContrast": "#EEF1FD",
//       "loContrast": "#C6D4F9"
//     },
//     "muted": {
//       "shadow": "#1A1D1E",
//       fill: "#787F85",
//       "stroke": "#697177",
//       "hiContrast": "#F8F9FA",
//       "loContrast": "#C1C8CD"
//     }
//   }
// }

export function mkThemeColors(base: string): ThemeColors {
  return {
    shadow,
    fill: base,
    stroke: base,
    hiContrast: complement(base),
    loContrast: invert(base),
  }
}


export const DefaultDiagramTheme: DiagramTheme = {
  font: 'Helvetica',
  relation: {
    lineColor: '#9ca3af',
    labelColor: '#e5e5e5',
  },
  colors: {
    primary: {
      shadow,
      fill: '#2563eb',
      stroke: '#1e40af',
      hiContrast: '#eff6ff',
      loContrast: '#bfdbfe'
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
      fill: '#0369a1',
      stroke: '#0c4a6e',
      hiContrast: '#f0f9ff',
      loContrast: '#bae6fd'
    },
    muted: {
      shadow,
      fill: '#4b5563',
      stroke: '#374151',
      hiContrast: '#f9fafb',
      loContrast: '#d1d5db'
    }
  }
}
