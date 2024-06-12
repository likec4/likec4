import { globalStyle, style } from '@vanilla-extract/css'
import { mantine } from '../mantine.css'

export const container = style({
  bottom: 0,
  left: 0,
  padding: 8,
  margin: 0
})

export const paper = style({
  cursor: 'default',
  minWidth: 100,
  maxWidth: 'calc(100vw - 16px)',
  backgroundColor: `color-mix(in srgb, ${mantine.colors.body}, transparent 20%)`,
  WebkitBackdropFilter: 'blur(8px)',
  backdropFilter: 'blur(8px)',
  '@media': {
    [mantine.largerThan('md')]: {
      maxWidth: '45vw'
    }
  }
})

export const title = style({})

export const description = style({
  whiteSpaceCollapse: 'preserve-breaks',
  color: mantine.colors.gray[7]
})
globalStyle(`:where([data-mantine-color-scheme="dark"]) ${description}`, {
  color: mantine.colors.gray[5]
})
