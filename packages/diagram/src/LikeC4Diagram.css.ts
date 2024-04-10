import { globalStyle, style } from '@vanilla-extract/css'
import { vars, xyvars } from './theme.css'

export const cssReactFlow = style({
  selectors: {
    '&.react-flow.dark': {
      vars: {
        [xyvars.background.color]: vars.likec4.backgroundColor
      }
    }
  },
  minHeight: 100,
  vars: {
    [xyvars.background.color]: vars.likec4.backgroundColor
  }
})

export const cssDisablePan = style({})

// globalStyle(`${cssDisablePan} .react-flow__pane`, {
//   cursor: 'default'
// })

export const cssTransparentBg = style({
  backgroundColor: 'transparent !important',
  vars: {
    [vars.likec4.backgroundColor]: 'transparent !important',
    [xyvars.background.color]: 'transparent !important'
  }
})

export const cssNoControls = style({})
globalStyle(`:where(${cssNoControls}, ${cssTransparentBg}) .react-flow__attribution`, {
  display: 'none'
})
