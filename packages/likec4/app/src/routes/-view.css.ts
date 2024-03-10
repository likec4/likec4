import { globalStyle, style } from '@vanilla-extract/css'

export const svgContainer = style({
  minWidth: 300
})

globalStyle(`${svgContainer} svg`, {
  width: '100%',
  height: 'auto'
})
