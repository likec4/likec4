// import colors from 'tailwindcss/colors'
import { Colors, RelationColors } from '@likec4/core/colors'
import type { DiagramTheme } from './types'

const shadow = '#0a0a0a'

export const DefaultDiagramTheme = {
  font: 'Helvetica',
  shadow,
  relation: RelationColors,
  colors: Colors,
} satisfies DiagramTheme

// const blue: ThemeColors  = {
//   shadow,
//   fill: colors.blue[500],
//   stroke: colors.blue[600],
//   hiContrast: colors.blue[50],
//   loContrast: colors.blue[100],
// } satisfies ThemeColors

// const sky  = {
//   shadow,
//   fill: colors.sky[600],
//   stroke: colors.sky[700],
//   hiContrast: colors.sky[50],
//   loContrast: colors.sky[100],
// } satisfies ThemeColors

// const slate = {
//   shadow,
//   fill: colors.slate[500],
//   stroke: colors.slate[600],
//   hiContrast: colors.slate[50],
//   loContrast: colors.slate[200],
// } satisfies ThemeColors

// export const DefaultDiagramTheme: DiagramTheme = {
//   font: 'Helvetica',
//   relation: {
//     lineColor: colors.neutral[400],
//     labelColor: colors.neutral[300],
//   },
//   colors: {
//     primary: blue,
//     blue,
//     secondary: sky,
//     sky,
//     muted: slate,
//     slate,
//     gray: {
//       shadow,
//       fill: colors.neutral[500],
//       stroke: colors.neutral[600],
//       hiContrast: colors.neutral[50],
//       loContrast: colors.neutral[200],
//     },
//     red: {
//       shadow,
//       fill: colors.red[500],
//       stroke: colors.red[600],
//       hiContrast: colors.red[50],
//       loContrast: colors.red[200],
//     },
//     green: {
//       shadow,
//       fill: colors.green[600],
//       stroke: colors.green[700],
//       hiContrast: colors.green[50],
//       loContrast: colors.green[200],
//     },
//     amber: {
//       shadow,
//       fill: colors.amber[600],
//       stroke: colors.amber[700],
//       hiContrast: colors.amber[50],
//       loContrast: colors.amber[200],
//     },
//     indigo: {
//       shadow,
//       fill: colors.indigo[500],
//       stroke: colors.indigo[600],
//       hiContrast: colors.indigo[50],
//       loContrast: colors.indigo[200],
//     }
//   }
// }
