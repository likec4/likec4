import { globalStyle, style } from '@vanilla-extract/css'
import { vars, xyvars } from './theme-vars'

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

globalStyle(`.react-flow${cssReactFlow} .xyflow__viewport`, {
  willChange: 'transform',
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
