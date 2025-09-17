import { styleDefaults } from './defaults'
import { defaultTheme } from './theme'
import type { LikeC4StyleConfig } from './types'

export const defaultStyle: LikeC4StyleConfig = {
  theme: defaultTheme,
  defaults: styleDefaults,
}

export { defaultTheme }

export { computeColorValues } from './compute-color-values'

export * from './types'
