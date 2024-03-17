import { themeToVars } from '@mantine/vanilla-extract'
import { createGlobalThemeContract } from '@vanilla-extract/css'

export const vars = /* @__PURE__ */ createGlobalThemeContract({
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

export const mantine = /* @__PURE__ */ themeToVars({})

export const xyvars = /* @__PURE__ */ createGlobalThemeContract({
  edge: {
    stroke: 'edge-stroke',
    strokeSelected: 'edge-stroke-selected',
    labelColor: 'edge-label-color',
    labelBgColor: 'edge-label-background-color',
    strokeWidth: 'edge-stroke-width'
  }
}, (value) => `xy-${value}`)
