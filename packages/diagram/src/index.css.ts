import { defaultTheme, type ThemeColor } from '@likec4/core'
import { createGlobalTheme, fallbackVar, globalStyle, style } from '@vanilla-extract/css'
import { mantine, vars } from './theme'

export const scope = style({})

createGlobalTheme(':root, :host', vars, {
  compound: {
    font: fallbackVar(vars.likec4.font, mantine.fontFamily)
  },
  element: {
    font: fallbackVar(vars.likec4.font, mantine.fontFamily),
    ...defaultTheme.elements.primary
  },
  relation: {
    ...defaultTheme.relationships.slate
  },
  likec4: {
    font: fallbackVar(mantine.fontFamily)
  }
})

for (const color of Object.keys(defaultTheme.elements)) {
  if (!(color in defaultTheme.elements) || !(color in defaultTheme.relationships)) {
    continue
  }
  createGlobalTheme(`:where([data-likec4-color='${color}'])`, {
    element: {
      fill: vars.element.fill,
      stroke: vars.element.stroke,
      hiContrast: vars.element.hiContrast,
      loContrast: vars.element.loContrast
    },
    relation: vars.relation
  }, {
    element: defaultTheme.elements[color as ThemeColor],
    relation: defaultTheme.relationships[color as ThemeColor]
  })
}

globalStyle('.mantine-ActionIcon-icon svg', {
  width: '75%',
  height: '75%'
})

globalStyle('.react-flow[data-likec4-nopan] .react-flow__pane', {
  cursor: 'default'
})

globalStyle('.react-flow[data-likec4-nobg]', {
  backgroundColor: 'transparent !important',
  vars: {
    '--xy-background-color': 'transparent'
  }
})
globalStyle('.react-flow[data-likec4-nobg] .react-flow__attribution', {
  display: 'none'
})

export {}
