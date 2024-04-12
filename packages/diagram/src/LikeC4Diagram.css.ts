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
  vars: {
    [xyvars.background.color]: vars.likec4.backgroundColor
  }
})

globalStyle(`${cssReactFlow} .react-flow__viewport`, {
  willChange: 'transform'
})

export const cssDisablePan = style({})

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
