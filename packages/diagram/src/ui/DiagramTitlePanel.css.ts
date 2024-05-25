import { globalStyle, style } from '@vanilla-extract/css'
import { mantine } from '../mantine.css'

export const container = style({
  bottom: 0,
  left: 0,
  padding: 0,
  paddingLeft: 8,
  paddingBottom: 8,
  margin: 0
})

export const paper = style({
  cursor: 'default',
  minWidth: 280,
  maxWidth: '45vw',
  backgroundColor: `color-mix(in srgb, ${mantine.colors.body}, transparent 20%)`,
  backdropFilter: 'blur(8px)'
})

export const title = style({
  userSelect: 'all'
})

export const description = style({
  userSelect: 'all',
  whiteSpaceCollapse: 'preserve-breaks',
  color: mantine.colors.gray[7]
})
globalStyle(`:where([data-mantine-color-scheme="dark"]) ${description}`, {
  color: mantine.colors.gray[5]
})
