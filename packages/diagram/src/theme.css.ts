import { createGlobalThemeContract } from '@vanilla-extract/css'

export const vars = createGlobalThemeContract({
  default: {
    font: 'default-font-family'
  },
  likec4: {
    font: 'font-family',
    background: {
      color: 'background-color',
      pattern: {
        color: 'background-pattern-color'
      }
    }
  },
  compound: {
    font: 'compound-font-family',
    titleColor: 'compound-title-color'
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
  },
  optionsPanel: {
    top: 'options-panel-top',
    right: 'options-panel-right'
  }
}, (value) => `likec4-${value}`)

export const xyvars = createGlobalThemeContract({
  background: {
    color: 'background-color',
    pattern: {
      color: 'background-pattern-color'
      // dots: 'background-pattern-dots-color',
      // lines: 'background-pattern-lines-color',
      // cross: 'background-pattern-cross-color'
    }
  },
  edge: {
    stroke: 'edge-stroke',
    strokeSelected: 'edge-stroke-selected',
    labelColor: 'edge-label-color',
    labelBgColor: 'edge-label-background-color',
    strokeWidth: 'edge-stroke-width'
  },
  node: {
    color: 'node-color',
    border: 'node-border',
    backgroundColor: 'node-background-color',
    groupBackgroundColor: 'node-group-background-color',
    boxshadowHover: 'node-boxshadow-hover',
    boxshadowSelected: 'node-boxshadow-selected',
    borderRadius: 'node-border-radius'
  }
}, (value) => `xy-${value}`)
