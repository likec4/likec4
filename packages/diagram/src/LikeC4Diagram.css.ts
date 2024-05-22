import { globalStyle, style } from '@vanilla-extract/css'
import { vars, xyvars } from './theme.css'

export const keepAspectRatioContainer = style({
  width: '100%',
  height: '100%',
  padding: 0
})

export const cssReactFlow = style({})

globalStyle(`.react-flow${cssReactFlow}`, {
  vars: {
    [xyvars.background.color]: vars.likec4.background.color,
    [xyvars.background.pattern.color]: vars.likec4.background.pattern.color
  }
})
globalStyle(`.react-flow${cssReactFlow} .react-flow__viewport`, {
  willChange: 'transform'
})

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
