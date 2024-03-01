import { defaultTheme, type ThemeColor } from '@likec4/core'
import { defaultTheme, type MantineTheme, type MantineThemeOverride } from '@mantine/core'
import { themeToVars } from '@mantine/vanilla-extract'
import {
  assignVars,
  createGlobalTheme,
  createGlobalThemeContract,
  createVar,
  fallbackVar,
  globalStyle
} from '@vanilla-extract/css'

export const vars = createGlobalThemeContract({
  likec4: {
    font: 'font-family'
  },
  compound: {
    font: 'compound-font-family'
  },
  element: {
    font: 'element-font-family',
    fill: 'element-fill',
    stroke: 'element-stroke',
    hiContrast: 'element-hiContrast',
    loContrast: 'element-loContrast'
  },
  relation: {
    lineColor: 'relation-lineColor',
    labelColor: 'relation-labelColor',
    labelBgColor: 'relation-labelBg'
  }
}, (value) => `likec4-${value}`)

export const mantine = themeToVars(defaultTheme)
