import type { RelationshipThemeColors, RelationshipThemeColorValues } from '../types/styles'

const gray = {
  lineColorLight: '#6E6E6E',
  lineColorDark: '#6E6E6E',
  labelBgColor: '#18191b',
  labelColor: '#C6C6C6',
} satisfies RelationshipThemeColorValues
const slate = {
  lineColorLight: '#64748b', // 500
  lineColorDark: '#64748b', // 500
  labelBgColor: '#0f172a', // 900
  labelColor: '#cbd5e1', // 300
} satisfies RelationshipThemeColorValues

const blue = {
  lineColorLight: '#3b82f6', // 500
  lineColorDark: '#3b82f6', // 500
  labelBgColor: '#172554', // 950
  labelColor: '#60a5fa', // 400
} satisfies RelationshipThemeColorValues

const sky = {
  lineColorLight: '#0ea5e9', // 500
  lineColorDark: '#0ea5e9', // 500
  labelBgColor: '#082f49', // 950
  labelColor: '#38bdf8', // 400
} satisfies RelationshipThemeColorValues

export const RelationshipColors = {
  amber: {
    lineColorLight: '#b45309',
    lineColorDark: '#b45309',
    labelBgColor: '#78350f',
    labelColor: '#FFE0C2',
  },
  blue,
  gray,
  green: {
    lineColorLight: '#15803d', // 700
    lineColorDark: '#15803d', // 700
    labelBgColor: '#052e16', // 950
    labelColor: '#22c55e', // 500
  },
  indigo: {
    lineColorLight: '#6366f1', // 500
    lineColorDark: '#6366f1', // 500
    labelBgColor: '#1e1b4b', // 950
    labelColor: '#818cf8', // 400
  },
  muted: slate,
  primary: blue,
  red: {
    lineColorLight: '#AC4D39',
    lineColorDark: '#AC4D39',
    labelBgColor: '#b91c1c',
    labelColor: '#f5b2a3',
  },
  secondary: sky,
  sky,
  slate,
} satisfies RelationshipThemeColors
