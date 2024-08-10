import '@xyflow/react/dist/style.css'

import { defaultTheme } from '@likec4/core'
import { createGlobalTheme, globalStyle } from '@vanilla-extract/css'
import { scale, toHex } from 'khroma'
import { keys, omit } from 'remeda'
import { mantine } from './mantine.css'
import { vars } from './theme.css'

export const rootClassName = 'likec4-diagram-root'

globalStyle(`.${rootClassName}`, {
  overflow: 'hidden',
  position: 'relative',
  width: '100%',
  height: '100%',
  padding: 0,
  margin: 0,
  boxSizing: 'border-box',
  WebkitFontSmoothing: mantine.webkitFontSmoothing,
  MozOsxFontSmoothing: mantine.mozFontSmoothing
})

createGlobalTheme(`.${rootClassName}`, {
  ...omit(vars, ['optionsPanel', 'navigationPanel', 'safariAnimationHook', 'default'])
}, {
  likec4: {
    font:
      `var(--likec4-default-font-family,'ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"')`,
    background: {
      color: mantine.colors.body,
      pattern: {
        color: mantine.colors.dark[3]
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
        color: mantine.colors.gray[6]
      }
    }
  }
})

for (const color of keys(defaultTheme.elements)) {
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
    element: defaultTheme.elements[color],
    compound: {
      titleColor: defaultTheme.elements[color].loContrast
    },
    relation: defaultTheme.relationships[color]
  })

  const compoundDarkColor = (color: string, depth: number) =>
    toHex(
      scale(color, {
        l: -22 - 5 * depth,
        s: -10 - 6 * depth
      })
    )
  const compoundLightColor = (color: string, depth: number) =>
    toHex(
      scale(color, {
        l: -20 - 3 * depth,
        s: -3 - 6 * depth
      })
    )

  const compounds = {
    fill: vars.element.fill,
    stroke: vars.element.stroke
  }

  for (let depth = 1; depth <= 6; depth++) {
    createGlobalTheme(
      `:where([data-likec4-color='${color}'][data-compound-depth='${depth}'])`,
      compounds,
      {
        fill: compoundLightColor(defaultTheme.elements[color].fill, depth),
        stroke: compoundLightColor(defaultTheme.elements[color].stroke, depth)
      }
    )

    createGlobalTheme(
      `:where([data-mantine-color-scheme='dark']) :where([data-likec4-color='${color}'][data-compound-depth='${depth}'])`,
      compounds,
      {
        fill: compoundDarkColor(defaultTheme.elements[color].fill, depth),
        stroke: compoundDarkColor(defaultTheme.elements[color].stroke, depth)
      }
    )
  }
}
