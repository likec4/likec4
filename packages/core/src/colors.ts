import type { ThemeColor } from './types/element'

export interface ElementColors {
  fill: string
  stroke: string
  hiContrast: string
  loContrast: string
}

const blue = {
  // fill: colors.blue[500],
  // stroke: colors.blue[600],
  // hiContrast: colors.blue[50],
  // loContrast: colors.blue[100],
  fill: '#3b82f6',
  stroke: '#2563eb',
  hiContrast: '#eff6ff',
  loContrast: '#dbeafe'
} satisfies ElementColors

const sky = {
  // fill: colors.sky[600],
  // stroke: colors.sky[700],
  // hiContrast: colors.sky[50],
  // loContrast: colors.sky[100],
  fill: '#0284c7',
  stroke: '#0369a1',
  hiContrast: '#f0f9ff',
  loContrast: '#e0f2fe'
} satisfies ElementColors

const slate = {
  // fill: colors.slate[500],
  // stroke: colors.slate[600],
  // hiContrast: colors.slate[50],
  // loContrast: colors.slate[200],
  fill: '#64748b',
  stroke: '#475569',
  hiContrast: '#f8fafc',
  loContrast: '#e2e8f0'
} satisfies ElementColors

export const RelationColors = {
  // lineColor: colors.neutral[400],
  // labelColor: colors.neutral[300],
  lineColor: '#a3a3a3',
  labelColor: '#d4d4d4',
} as const

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
    fill: '#ef4444',
    stroke: '#dc2626',
    hiContrast: '#fef2f2',
    loContrast: '#fecaca'
  },
  green: {
    // fill: colors.green[600],
    // stroke: colors.green[700],
    // hiContrast: colors.green[50],
    // loContrast: colors.green[200],
    fill: '#16a34a',
    stroke: '#15803d',
    hiContrast: '#f0fdf4',
    loContrast: '#bbf7d0'
  },
  amber: {
    // fill: colors.amber[600],
    // stroke: colors.amber[700],
    // hiContrast: colors.amber[50],
    // loContrast: colors.amber[200],
    fill: '#d97706',
    stroke: '#b45309',
    hiContrast: '#fffbeb',
    loContrast: '#fde68a'
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
} as const satisfies {
  [key in ThemeColor]: ElementColors
}
