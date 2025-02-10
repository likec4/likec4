import { rem } from '@mantine/core'
import { fallbackVar, globalStyle, style } from '@vanilla-extract/css'
import { mantine } from '../../../theme-vars'
import { vars, whereDark, whereLight } from '../../../theme-vars.css'
import { button } from './_shared.css'
export { focusable } from './_shared.css'

export const backdrop = style({
  position: 'fixed',
  zIndex: 900,
  inset: 0,
  backgroundColor: 'rgb(34 34 34 / 0.95)',
  WebkitBackdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(6px)'),
  backdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(6px)'),

  selectors: {
    [`${whereLight} &`]: {
      backgroundColor: 'rgb(255 255 255 / 0.92  )',
    },
  },
})
export const root = style({
  position: 'fixed',
  zIndex: 901,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  maxHeight: '100vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'stretch',
  gap: mantine.spacing.md,
  paddingTop: rem(32),
  paddingLeft: rem(16),
  paddingRight: rem(16),
  paddingBottom: 0,
})
export const input = style({
  borderColor: 'transparent',
  backgroundColor: 'transparent',
  selectors: {
    [`${whereDark} &`]: {
      WebkitBackdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(6px)'),
      backdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(6px)'),
      background: `color-mix(in srgb, var(--input-bg), transparent 50%)`,
    },
  },
})

export const pickviewBackdrop = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgb(34 34 34 / 0.5)',
  zIndex: 902,
  WebkitBackdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(6px)'),
  backdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(6px)'),
  selectors: {
    [`${whereLight} &`]: {
      backgroundColor: 'rgb(255 255 255 / 0.6  )',
    },
  },
})
export const pickview = style({
  position: 'absolute',
  top: '2rem',
  left: '50%',
  width: '100%',
  maxWidth: 600,
  minWidth: 200,
  transform: 'translateX(-50%)',
  zIndex: 903,
  // backgroundColor: mantine.colors.dark[6],
  // padding: rem(16),
  // display: 'flex',
  // flexDirection: 'column',
  // gap: rem(16),
})

export const pickviewGroup = style({
  selectors: {
    '& + &': {
      marginTop: rem(16),
    },
  },
})

globalStyle(`${whereDark} ${pickview} ${button}`, {
  borderColor: mantine.colors.dark[5],
  backgroundColor: mantine.colors.dark[6],
})
globalStyle(`${whereDark} ${pickview} ${button}:focus`, {
  backgroundColor: mantine.colors.primaryColors[8],
  borderColor: mantine.colors.primaryColors[8],
})

export const scrollarea = style({
  display: 'flex',
  flexDirection: 'column',
  gap: rem(8),
})
