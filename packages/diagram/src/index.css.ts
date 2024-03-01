import { defaultTheme, type ThemeColor } from '@likec4/core'
import { createGlobalTheme, fallbackVar, style } from '@vanilla-extract/css'
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

// createGlobalTheme('body', vars, {
//   likec4: {
//     font: fallbackVar(mantine.fontFamily),
//     element: {
//       fill: vars.likec4.element.fill,
//       stroke: vars.likec4.element.stroke,
//       hiContrast: vars.likec4.element.hiContrast,
//       loContrast: vars.likec4.element.loContrast
//     },
//     relation: {
//       lineColor: vars.likec4.relation.lineColor,
//       labelColor: vars.likec4.relation.labelColor,
//       labelBg: vars.likec4.relation.labelBg
//     }
//   }
// });
// createGlobalTheme(':where(.selected)', vars, {
//     likec4: {
//     font: fallbackVar(mantine.fontFamily),
//     element: {
//       fill: vars.likec4.element.fill,
//       stroke: vars.likec4.element.stroke,
//       hiContrast: vars.likec4.element.hiContrast,
//       loContrast: vars.likec4.element.loContrast
//     },
//     relation: {
//       lineColor: vars.likec4.relation.lineColor,
//       labelColor: vars.likec4.relation.labelColor,
//       labelBg: vars.likec4.relation.labelBg
//     }
//   }
// })

export {}
