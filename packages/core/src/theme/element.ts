import type { ElementThemeColors, ElementThemeColorValues } from '../types'

const blue = {
  fill: '#3b82f6',
  stroke: '#2563eb',
  hiContrast: '#eff6ff',
  loContrast: '#bfdbfe',
} satisfies ElementThemeColorValues

const sky = {
  fill: '#0284c7',
  stroke: '#0369a1',
  hiContrast: '#f0f9ff',
  loContrast: '#B6ECF7',
} satisfies ElementThemeColorValues

const slate = {
  fill: '#64748b',
  stroke: '#475569',
  hiContrast: '#f8fafc',
  loContrast: '#cbd5e1',
} satisfies ElementThemeColorValues

export const ElementColors = {
  primary: blue,
  blue,
  secondary: sky,
  sky,
  muted: slate,
  slate,
  gray: {
    fill: '#737373',
    stroke: '#525252',
    hiContrast: '#fafafa',
    loContrast: '#d4d4d4',
  },
  red: {
    fill: '#AC4D39',
    stroke: '#853A2D',
    hiContrast: '#FBD3CB',
    loContrast: '#f5b2a3',
  },
  green: {
    fill: '#428a4f',
    stroke: '#2d5d39',
    hiContrast: '#f8fafc',
    loContrast: '#c2f0c2',
  },
  amber: {
    fill: '#A35829',
    stroke: '#7E451D',
    hiContrast: '#FFE0C2',
    loContrast: '#f9b27c',
  },
  indigo: {
    fill: '#6366f1',
    stroke: '#4f46e5',
    hiContrast: '#eef2ff',
    loContrast: '#c7d2fe',
  },
} as const satisfies ElementThemeColors
