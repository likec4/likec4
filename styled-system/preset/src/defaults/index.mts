import { ElementColors } from './element-colors.ts'
import { RelationshipColors } from './relationship-colors.ts'
import { defaultSizes } from './sizes.ts'
import { type LikeC4Theme, type ThemeColor, type ThemeColorValues, ThemeColors } from './types.ts'

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

export * from './element-colors.ts'
export * from './relationship-colors.ts'
export * from './types.ts'
export * from './vars.ts'
