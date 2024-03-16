import { globalStyle, style } from '@vanilla-extract/css'

// Index page

export const cssPreviewCardLink = style({
  position: 'absolute',
  inset: 0,
  zIndex: 1
})

//

export const svgContainer = style({
  minWidth: 300
})

globalStyle(`${svgContainer} svg`, {
  width: '100%',
  height: 'auto'
})
