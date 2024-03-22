import { globalStyle, style } from '@vanilla-extract/css'
import { vars, xyvars } from './theme.css'

export const cssDisablePan = style({})

globalStyle(`${cssDisablePan} .react-flow__pane`, {
  cursor: 'default'
})

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

export const cssReactFlow = style({
  backgroundColor: vars.likec4.backgroundColor,
  vars: {
    [xyvars.background.color]: vars.likec4.backgroundColor
  }
})
