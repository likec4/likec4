import { globalStyle, style } from '@vanilla-extract/css'
import { vars, xyvars } from './theme.css'

export const cssReactFlow = style({
  '@supports': {
    // https://wojtek.im/journal/targeting-safari-with-css-media-query
    '(hanging-punctuation: first) and (font: -apple-system-body) and (-webkit-appearance: none)': {
      // TODO: this workaround disables animations in Safari (to improve performance)
      vars: {
        [vars.safariAnimationHook]: ''
      }
    }
  }
})

globalStyle(`.react-flow${cssReactFlow}`, {
  vars: {
    [xyvars.background.color]: vars.likec4.background.color,
    [xyvars.background.pattern.color]: vars.likec4.background.pattern.color
  }
})

// globalStyle(`.react-flow${cssReactFlow} .react-flow__node`, {
//   willChange: 'transform'
// })

export const cssDisablePan = style({})

export const cssTransparentBg = style({})

globalStyle(`.react-flow${cssReactFlow}${cssTransparentBg}`, {
  backgroundColor: 'transparent !important',
  vars: {
    [vars.likec4.background.color]: 'transparent !important',
    [xyvars.background.color]: 'transparent !important'
  }
})

export const cssNoControls = style({})
globalStyle(`:where(${cssNoControls}, ${cssTransparentBg}) .react-flow__attribution`, {
  display: 'none'
})
