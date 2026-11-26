import type { ElementColorValues, ThemeColor } from './types'
import { ElementColors as DefaultElementColors } from '@likec4/style-preset/defaults'

// ensure types are correct
export const ElementColors: Record<ThemeColor, ElementColorValues> = DefaultElementColors
