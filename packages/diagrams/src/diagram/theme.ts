import { complement, invert } from 'khroma'
import type { DiagramTheme, ThemeColors } from './types'

const shadow = '#1A1D1E'

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
    lineColor: '#889096',
    labelColor: '#D7DBDF',
  },
  colors: {
    primary: {
      shadow,
      fill: '#3E63DD',
      stroke: '#5373E7',
      hiContrast: '#EEF1FD',
      loContrast: '#AEC0F5'
    },
    // secondary: mkThemeColors('#5373E7'),
    secondary: {
      shadow,
      fill: '#5373E7',
      stroke: '#2F4EB2',
      hiContrast: '#EEF1FD',
      loContrast: '#C6D4F9'
    },
    muted: {
      shadow,
      fill: '#787F85',
      stroke: '#697177',
      hiContrast: '#F8F9FA',
      loContrast: '#C1C8CD'
    }
  }
}
