import { themeToVars } from '@mantine/vanilla-extract'
import { createGlobalThemeContract } from '@vanilla-extract/css'

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

export const mantine = themeToVars({})
