import { fallbackVar, globalStyle, style } from '@vanilla-extract/css'
import { mantine } from '../mantine.css'
import { vars } from '../theme.css'

export const container = style({
  bottom: 0,
  left: 0,
  padding: 8,
  margin: 0
})

export const card = style({
  cursor: 'default',
  minWidth: 200,
  maxWidth: 'calc(100vw - 16px)',
  backgroundColor: `color-mix(in srgb, ${mantine.colors.body}, transparent 20%)`,
  WebkitBackdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(8px)'),
  backdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(8px)'),
  '@media': {
    [mantine.largerThan('sm')]: {
      minWidth: 250,
      maxWidth: '90vw'
    },
    [mantine.largerThan('md')]: {
      minWidth: 350,
      maxWidth: '70vw'
    }
  },
  selectors: {
    [`:where([data-mantine-color-scheme='dark']) &`]: {
      backgroundColor: `color-mix(in srgb, ${mantine.colors.dark[6]}, transparent 20%)`
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
