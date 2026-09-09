import { defineTokens } from '@pandacss/dev'
import { colors } from './colors.ts'
import { borders, borderWidths, cursor, opacity, zIndex } from './misc.ts'
import { animations, durations, easings } from './motion.ts'
import { radii } from './radii.ts'
import { shadows } from './shadows.ts'
import { sizes } from './sizes.ts'
import { spacing } from './spacing.ts'
import { fonts, fontSizes, fontWeights, letterSpacings, lineHeights } from './typography.ts'

export const tokens = defineTokens({
  fontSizes,
  fontWeights,
  lineHeights,
  fonts,
  letterSpacings,
  sizes,
  borders,
  borderWidths,
  spacing,
  radii,
  colors,
  easings,
  durations,
  shadows,
  zIndex,
  opacity,
  cursor,
})
