import { ElementColors } from './element-colors.js'
import { RelationshipColors } from './relationship-colors.js'
import { defaultSizes } from './sizes.js'
// import { ThemeColors } from './types.js'
import { type LikeC4Theme, type ThemeColor, type ThemeColorValues, ThemeColors } from './types.js'

export const defaultTheme = {
  colors: ThemeColors.reduce((acc, key) => {
    acc[key] = {
      elements: ElementColors[key],
      relationships: RelationshipColors[key],
    }
    return acc
  }, {} as Record<ThemeColor, ThemeColorValues>),
  ...defaultSizes,
} as const satisfies LikeC4Theme

export * from './element-colors.js'
export * from './relationship-colors.js'
export * from './types.js'
export * from './vars.js'
