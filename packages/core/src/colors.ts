import type { LikeC4Theme, ThemeColorValues, ThemeColors, ThemeRelationColors } from './types/theme'

const blue = {
  // fill: colors.blue[500],
  // stroke: colors.blue[600],
  // hiContrast: colors.blue[50],
  // loContrast: colors.blue[200],
  fill: '#3b82f6',
  stroke: '#2563eb',
  hiContrast: '#eff6ff',
  loContrast: '#bfdbfe'
} satisfies ThemeColorValues

const sky = {
  // fill: colors.sky[600],
  // stroke: colors.sky[700],
  // hiContrast: colors.sky[50],
  // loContrast: colors.sky[100],
  fill: '#0284c7',
  stroke: '#0369a1',
  hiContrast: '#f0f9ff',
  loContrast: '#e0f2fe'
} satisfies ThemeColorValues

const slate = {
  // fill: colors.slate[500],
  // stroke: colors.slate[600],
  // hiContrast: colors.slate[50],
  // loContrast: colors.slate[200],
  fill: '#64748b',
  stroke: '#475569',
  hiContrast: '#f8fafc',
  loContrast: '#e2e8f0'
} satisfies ThemeColorValues

export const RelationColors = {
  lineColor: '#b1b1b1',
  labelColor: '#b1b1b1'
} as const satisfies ThemeRelationColors

export const Colors = {
  primary: blue,
  blue,
  secondary: sky,
  sky,
  muted: slate,
  slate,
  gray: {
    // fill: colors.neutral[500],
    // stroke: colors.neutral[600],
    // hiContrast: colors.neutral[50],
    // loContrast: colors.neutral[200],
    fill: '#737373',
    stroke: '#525252',
    hiContrast: '#fafafa',
    loContrast: '#e5e5e5'
  },
  red: {
    // fill: colors.red[500],
    // stroke: colors.red[600],
    // hiContrast: colors.red[50],
    // loContrast: colors.red[200],
    fill: '#b54548',
    stroke: '#8c333a',
    // hiContrast: '#fef2f2',
    // loContrast: '#fecaca',
    // hiContrast: '#191111', // colors.gray[900],
    // loContrast: '#3b1219' // colors.gray[800],
    hiContrast: '#f8fafc',
    // hiContrast: '#f8fafc',
    // loContrast: '#fdd8d8' // radix black red 12
    loContrast: '#F9C6C6'
  },
  green: {
    fill: '#428a4f',
    stroke: '#2d5d39',
    hiContrast: '#f8fafc',
    loContrast: '#c2f0c2'
  },
  amber: {
    // fill: colors.amber[600],
    // stroke: colors.amber[700],
    // hiContrast: colors.amber[50],
    // loContrast: colors.amber[200],
    fill: '#d97706',
    stroke: '#b45309',
    // hiContrast: '#fffbeb',
    // loContrast: '#fde68a',
    hiContrast: '#f8fafc', // colors.gray[900],
    loContrast: '#ffe0c2' // colors.gray[800],
  },
  indigo: {
    // fill: colors.indigo[500],
    // stroke: colors.indigo[600],
    // hiContrast: colors.indigo[50],
    // loContrast: colors.indigo[200],
    fill: '#6366f1',
    stroke: '#4f46e5',
    hiContrast: '#eef2ff',
    loContrast: '#c7d2fe'
  }
} as const satisfies ThemeColors

export const defaultTheme = {
  font: 'Helvetica',
  shadow: '#0a0a0a',
  relation: RelationColors,
  colors: Colors
} as const satisfies LikeC4Theme
