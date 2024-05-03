import type { ThemeColor } from '@likec4/core'
import { defaultTheme } from '@likec4/core'
import { createGlobalTheme, fallbackVar, globalStyle, style } from '@vanilla-extract/css'
import { omit } from 'remeda'
import { mantine } from './mantine.css'
import { vars } from './theme.css'

export const scope = style({})

globalStyle(`${scope} *, ${scope} *::before, ${scope} *::after`, {
  boxSizing: 'border-box',
  outline: 'none',
  borderWidth: 0,
  borderStyle: 'solid',
  borderColor: 'transparent'
})

createGlobalTheme(':root', {
  ...omit(vars, ['optionsPanel'])
}, {
  likec4: {
    font: fallbackVar('var(--likec4-default-font-family)', 'Helvetica, Arial, sans-serif'),
    backgroundColor: mantine.colors.body
  },
  compound: {
    font: vars.likec4.font,
    titleColor: vars.element.loContrast
  },
  element: {
    font: vars.likec4.font,
    ...defaultTheme.elements.primary
  },
  relation: {
    ...defaultTheme.relationships.slate
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
    compound: {
      titleColor: vars.compound.titleColor
    },
    relation: vars.relation
  }, {
    element: defaultTheme.elements[color as ThemeColor],
    compound: {
      titleColor: defaultTheme.elements[color as ThemeColor].loContrast
    },
    relation: defaultTheme.relationships[color as ThemeColor]
  })
}
