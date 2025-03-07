import { fallbackVar, style } from '@vanilla-extract/css'
import { mantine, vars, whereDark, whereNotReducedGraphics } from '../../../theme-vars'

export const card = style({
  cursor: 'default',
  minWidth: 200,
  maxWidth: 'calc(100vw - 16px)',
  width: 'auto',
  backgroundColor: mantine.colors.body,
  borderRadius: '0px',
  '@media': {
    [mantine.largerThan('sm')]: {
      minWidth: 250,
      maxWidth: '90vw',
    },
    [mantine.largerThan('md')]: {
      minWidth: 350,
      maxWidth: '70vw',
    },
  },
  selectors: {
    [`${whereDark} &`]: {
      backgroundColor: mantine.colors.dark[6],
    },
    [`${whereNotReducedGraphics} &`]: {
      borderRadius: mantine.radius.sm,
      backgroundColor: `color-mix(in srgb, ${mantine.colors.body}, transparent 20%)`,
      WebkitBackdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(8px)'),
      backdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(8px)'),
    },
    [`${whereDark} ${whereNotReducedGraphics} &`]: {
      backgroundColor: `color-mix(in srgb, ${mantine.colors.dark[6]}, transparent 20%)`,
    },
  },
})

export const title = style({})

export const description = style({
  whiteSpaceCollapse: 'preserve-breaks',
  color: mantine.colors.gray[7],
  selectors: {
    [`${whereDark} &`]: {
      color: mantine.colors.gray[5],
    },
  },
})
