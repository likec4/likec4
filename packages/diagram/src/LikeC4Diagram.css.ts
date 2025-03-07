import { defaultTheme } from '@likec4/core'
import { createGlobalTheme, globalStyle, style } from '@vanilla-extract/css'
import { scale, toHex } from 'khroma'
import { keys, omit } from 'remeda'
import {
  mantine,
  rootClassName,
  vars,
  whereDark,
  whereNotReducedGraphics,
  whereReducedGraphics,
  xyvars,
} from './theme-vars'

export const cssReactFlow = style({
  '@supports': {
    // https://wojtek.im/journal/targeting-safari-with-css-media-query
    '(hanging-punctuation: first) and (font: -apple-system-body) and (-webkit-appearance: none)': {
      // TODO: this workaround disables animations in Safari (to improve performance)
      vars: {
        [vars.safariAnimationHook]: '',
      },
    },
  },
})

export const reactFlowReducedGraphics = `${whereReducedGraphics} ${cssReactFlow}`
export const reactFlow = `${whereNotReducedGraphics} ${cssReactFlow}`

export const notInitialized = style({
  opacity: 0,
})
globalStyle(`.react-flow.not-initialized`, {
  opacity: 0,
})

globalStyle(`.react-flow${cssReactFlow}`, {
  vars: {
    [xyvars.background.color]: vars.likec4.background.color,
    [xyvars.background.pattern.color]: vars.likec4.background.pattern.color,
  },
})

globalStyle(`.react-flow${cssReactFlow} .react-flow__pane`, {
  WebkitUserSelect: 'none',
})
export const cssDisablePan = style({})

export const cssTransparentBg = style({})

globalStyle(`.react-flow${cssReactFlow}${cssTransparentBg}`, {
  backgroundColor: 'transparent !important',
  vars: {
    [vars.likec4.background.color]: 'transparent !important',
    [xyvars.background.color]: 'transparent !important',
  },
})

globalStyle(`:where(.react-flow${cssReactFlow}, ${cssTransparentBg}) .react-flow__attribution`, {
  display: 'none',
})

export const hiddenIfZoomTooSmall = style({
  selectors: {
    [`:where([data-likec4-zoom-small="true"]) &`]: {
      visibility: 'hidden',
    },
  },
})

export const hiddenIfReducedGraphics = style({
  selectors: {
    [`${reactFlowReducedGraphics} &`]: {
      visibility: 'hidden',
    },
  },
})

globalStyle(`.${rootClassName}`, {
  overflow: 'hidden',
  position: 'relative',
  width: '100%',
  height: '100%',
  padding: 0,
  margin: 0,
  boxSizing: 'border-box',
  WebkitFontSmoothing: mantine.webkitFontSmoothing,
  MozOsxFontSmoothing: mantine.mozFontSmoothing,
})
globalStyle(`:where(.${rootClassName}) .mantine-ActionIcon-icon .tabler-icon`, {
  width: '75%',
  height: '75%',
})

createGlobalTheme(`.${rootClassName}`, {
  ...omit(vars, ['optionsPanel', 'navigationPanel', 'safariAnimationHook', 'default']),
}, {
  likec4: {
    font:
      `var(--likec4-default-font-family,'ui-sans-serif,system-ui,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"')`,
    background: {
      color: mantine.colors.body,
      pattern: {
        color: mantine.colors.gray[4],
      },
    },
  },
  compound: {
    font: vars.likec4.font,
    titleColor: vars.element.loContrast,
  },
  element: {
    font: vars.likec4.font,
    ...defaultTheme.elements.primary,
  },
  relation: {
    ...defaultTheme.relationships.slate,
  },
})

createGlobalTheme(`${whereDark} .${rootClassName}`, {
  likec4: {
    background: {
      pattern: {
        color: vars.likec4.background.pattern.color,
      },
    },
  },
}, {
  likec4: {
    background: {
      pattern: {
        color: mantine.colors.dark[5],
      },
    },
  },
})

for (const color of keys(defaultTheme.elements)) {
  createGlobalTheme(`:where([data-likec4-color='${color}'])`, {
    element: {
      fill: vars.element.fill,
      stroke: vars.element.stroke,
      hiContrast: vars.element.hiContrast,
      loContrast: vars.element.loContrast,
    },
    compound: {
      titleColor: vars.compound.titleColor,
    },
    relation: vars.relation,
  }, {
    element: defaultTheme.elements[color],
    compound: {
      titleColor: defaultTheme.elements[color].loContrast,
    },
    relation: defaultTheme.relationships[color],
  })

  const compoundDarkColor = (color: string, depth: number) =>
    toHex(
      scale(color, {
        l: -22 - 5 * depth,
        s: -10 - 6 * depth,
      }),
    )
  const compoundLightColor = (color: string, depth: number) =>
    toHex(
      scale(color, {
        l: -20 - 3 * depth,
        s: -3 - 6 * depth,
      }),
    )

  const compounds = {
    fill: vars.element.fill,
    stroke: vars.element.stroke,
  }

  for (let depth = 1; depth <= 6; depth++) {
    createGlobalTheme(
      `:where([data-likec4-color='${color}'][data-compound-depth='${depth}'])`,
      compounds,
      {
        fill: compoundLightColor(defaultTheme.elements[color].fill, depth),
        stroke: compoundLightColor(defaultTheme.elements[color].stroke, depth),
      },
    )

    createGlobalTheme(
      `${whereDark} :where([data-likec4-color='${color}'][data-compound-depth='${depth}'])`,
      compounds,
      {
        fill: compoundDarkColor(defaultTheme.elements[color].fill, depth),
        stroke: compoundDarkColor(defaultTheme.elements[color].stroke, depth),
      },
    )
  }
}
