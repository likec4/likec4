import type { ElementThemeColors, ElementThemeColorValues } from '../types'

const blue = {
  fill: '#3b82f6',
  stroke: '#2563eb',
  hiContrast: '#eff6ff',
  loContrast: '#bfdbfe',
  light: '#cee2ff',
  dark: '#004ec5',
} satisfies ElementThemeColorValues

const sky = {
  fill: '#0284c7',
  stroke: '#0369a1',
  hiContrast: '#f0f9ff',
  loContrast: '#B6ECF7',
  light: '#a1dcfc',
  dark: '#0072b1',
} satisfies ElementThemeColorValues

const slate = {
  fill: '#64748b',
  stroke: '#475569',
  hiContrast: '#f8fafc',
  loContrast: '#cbd5e1',
  light: '#c5ccd5',
  dark: '#43556c',
} satisfies ElementThemeColorValues

export const ElementColors = {
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
    loContrast: '#d4d4d4',
    light: '#cdcdcd',
    dark: '#5e5457',
  },
  red: {
    // fill: colors.red[500],
    // stroke: colors.red[600],
    // hiContrast: colors.red[50],
    // loContrast: colors.red[200],
    fill: '#AC4D39',
    // fill: '#b54548',
    stroke: '#853A2D',
    // hiContrast: '#fef2f2',
    // loContrast: '#fecaca',
    // hiContrast: '#191111', // colors.gray[900],
    // loContrast: '#3b1219' // colors.gray[800],
    hiContrast: '#FBD3CB',
    // hiContrast: '#f8fafc',
    // loContrast: '#fdd8d8' // radix black red 12
    loContrast: '#f5b2a3',
    light: '#e6bdb4',
    dark: '##',
  },
  green: {
    fill: '#428a4f',
    stroke: '#2d5d39',
    hiContrast: '#f8fafc',
    loContrast: '#c2f0c2',
    light: '#bedec4',
    dark: '#337640',
  },
  amber: {
    fill: '#A35829',
    stroke: '#7E451D',
    hiContrast: '#FFE0C2',
    loContrast: '#f9b27c',
    light: '#dda887',
    dark: '#8d491e',
  },
  indigo: {
    // fill: colors.indigo[500],
    // stroke: colors.indigo[600],
    // hiContrast: colors.indigo[50],
    // loContrast: colors.indigo[200],
    fill: '#6366f1',
    stroke: '#4f46e5',
    hiContrast: '#eef2ff',
    loContrast: '#c7d2fe',
    light: '#d3d4ff',
    dark: '#1016d1',
  },
} as const satisfies ElementThemeColors
