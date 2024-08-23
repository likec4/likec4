import { defaultTheme } from '@likec4/core'
import { createGlobalTheme, globalStyle } from '@vanilla-extract/css'
import { scale, toHex } from 'khroma'
import { keys, omit } from 'remeda'
import { mantine, whereDark } from './mantine.css'
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
        color: mantine.colors.gray[4]
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
})

createGlobalTheme(`${whereDark} .${rootClassName}`, {
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
        color: mantine.colors.dark[5]
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
      `${whereDark} :where([data-likec4-color='${color}'][data-compound-depth='${depth}'])`,
      compounds,
      {
        fill: compoundDarkColor(defaultTheme.elements[color].fill, depth),
        stroke: compoundDarkColor(defaultTheme.elements[color].stroke, depth)
      }
    )
  }
}
