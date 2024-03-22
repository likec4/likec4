import type { ThemeColor } from '@likec4/core'
import { defaultTheme } from '@likec4/core'
import { createGlobalTheme, fallbackVar, style } from '@vanilla-extract/css'
import { mantine } from './mantine'
import { vars, xyvars } from './theme.css'

export const scope = style({})

createGlobalTheme(':root', {
  ...vars,
  xyflowbg: xyvars.background
}, {
  compound: {
    font: fallbackVar(vars.likec4.font, mantine.fontFamily),
    titleColor: vars.element.loContrast
  },
  element: {
    font: fallbackVar(vars.likec4.font, mantine.fontFamily),
    ...defaultTheme.elements.primary
  },
  relation: {
    ...defaultTheme.relationships.slate
  },
  likec4: {
    font: mantine.fontFamily,
    backgroundColor: mantine.colors.body
  },
  xyflowbg: {
    color: vars.likec4.backgroundColor
    // pattern: {
    //   dots: mantine.colors.defaultBorder,
    //   lines: mantine.colors.body,
    //   cross: mantine.colors.body
    // }
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
