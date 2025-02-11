import { rem } from '@mantine/core'
import { fallbackVar, globalStyle, style } from '@vanilla-extract/css'
import { mantine } from '../../../theme-vars'
import { vars, whereDark, whereLight } from '../../../theme-vars.css'
import { button, buttonFocused } from './_shared.css'
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
  containerName: 'likec4-search',
  containerType: 'size',
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
  WebkitBackdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(6px)'),
  backdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(6px)'),
  backgroundColor: 'transparent',
  ':focus-within': {
    backgroundColor: `color-mix(in srgb, ${mantine.colors.gray[3]}, transparent 45%)`,
  },
  selectors: {
    [`${whereDark} &`]: {},
    [`${whereDark} &:focus-within`]: {
      backgroundColor: `color-mix(in srgb, ${mantine.colors.dark[4]}, transparent 45%)`,
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
})

export const pickviewGroup = style({
  marginTop: rem(8),
  selectors: {
    '& + &': {
      marginTop: rem(32),
    },
  },
})

globalStyle(`${whereDark} ${pickview} ${button}`, {
  borderColor: mantine.colors.dark[5],
  backgroundColor: mantine.colors.dark[6],
})
globalStyle(`${whereDark} ${pickview} ${button}:hover`, {
  ...buttonFocused,
  backgroundColor: `color-mix(in srgb, ${buttonFocused.backgroundColor}, transparent 40%)`,
})
globalStyle(`${whereDark} ${pickview} ${button}:focus`, buttonFocused)

export const scrollArea = style({
  height: [
    '100cqh',
    '100%',
  ],
})

globalStyle(`.${scrollArea} .mantine-ScrollArea-viewport`, {
  minHeight: '100%',
})

globalStyle(`.${scrollArea} .mantine-ScrollArea-viewport > div`, {
  minHeight: '100%',
  height: '100%',
})
