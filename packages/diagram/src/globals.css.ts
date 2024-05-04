import type { ThemeColor } from '@likec4/core'
import { defaultTheme } from '@likec4/core'
import { createGlobalTheme, createTheme, fallbackVar, globalStyle, style } from '@vanilla-extract/css'
import { omit } from 'remeda'
import { mantine } from './mantine.css'
import { vars } from './theme.css'

export const rootClassName = 'likec4-diagram-root'

createGlobalTheme(`.${rootClassName}`, {
  ...omit(vars, ['optionsPanel', 'default'])
}, {
  likec4: {
    font:
      `var(--likec4-default-font-family,'ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"')`,
    background: {
      color: mantine.colors.body,
      pattern: {
        color: mantine.colors.dimmed
      }
    }
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
  // likec4: {
  //   font: `var(--likec4-font-family,'ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"')`,
  //   backgroundColor: fallbackVar(globalvars.likec4.backgroundColor, mantine.colors.body)
  // },
  // compound: {
  //   font: fallbackVar(vars.compound.font, vars.likec4.font),
  //   titleColor: fallbackVar(globalvars.compound.titleColor, globalvars.element.loContrast),
  // },
  // element: {
  //   font: fallbackVar(globalvars.element.font, vars.likec4.font),
  //   fill: fallbackVar(globalvars.element.fill, defaultTheme.elements.primary.fill),
  //   stroke: fallbackVar(globalvars.element.stroke, defaultTheme.elements.primary.stroke),
  //   hiContrast: fallbackVar(globalvars.element.hiContrast, defaultTheme.elements.primary.hiContrast),
  //   loContrast: fallbackVar(globalvars.element.loContrast, defaultTheme.elements.primary.loContrast),
  // },
  // relation: {
  //   lineColor: fallbackVar(globalvars.relation.lineColor, defaultTheme.relationships.slate.lineColor),
  //   labelColor: fallbackVar(globalvars.relation.labelColor, defaultTheme.relationships.slate.labelColor),
  //   labelBgColor: fallbackVar(globalvars.relation.labelBgColor, defaultTheme.relationships.slate.labelBgColor),
  // },
  // optionsPanel: {
  //   top: globalvars.optionsPanel.top,
  //   right: globalvars.optionsPanel.right
  // }
})

createGlobalTheme(`:where([data-mantine-color-scheme='light']) .${rootClassName}`, {
  likec4: {
    background: {
      pattern: {
        color: vars.likec4.background.pattern.color
      }
    }
  }
}, {
  likec4: {
    background: {
      pattern: {
        color: mantine.colors.dark[3]
      }
    }
  }
})

// globalStyle(`${scope} *, ${scope} *::before, ${scope} *::after`, {
//   boxSizing: 'border-box',
//   outline: 'none',
//   borderWidth: 0,
//   borderStyle: 'solid',
//   borderColor: 'transparent',
// })

// createGlobalTheme(':where(.likec4-diagram-root)', {
//   ...omit(vars, ['optionsPanel', 'defaults']),
// }, {
//   likec4: {
//     font: `var(--likec4-default-font-family,'ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"')`,
//     backgroundColor: mantine.colors.body
//   },
//   compound: {
//     font: vars.likec4.font,
//     titleColor: vars.element.loContrast
//   },
//   element: {
//     font: vars.likec4.font,
//     ...defaultTheme.elements.primary
//   },
//   relation: {
//     ...defaultTheme.relationships.slate
//   }
// })

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
