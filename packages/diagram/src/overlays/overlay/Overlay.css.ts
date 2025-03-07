import { createVar, style } from '@vanilla-extract/css'
import { calc } from '@vanilla-extract/css-utils'
import { mantine, whereLight } from '../../theme-vars'

export const backdropBlur = createVar('backdrop-blur')
export const backdropOpacity = createVar('backdrop-opacity')
const backdropColor = createVar('backdrop-color')

const borderRadius = createVar('border-radius')
export const dialog = style({
  boxSizing: 'border-box',
  margin: 0,
  position: 'fixed',
  inset: '5rem 4rem 4rem 4rem',
  width: 'auto',
  height: 'auto',
  maxWidth: '100vw',
  maxHeight: '100vh',
  background: `color-mix(in srgb, ${mantine.colors.defaultBorder}, transparent 50%)`,
  boxShadow: mantine.shadows.xl,
  border: `0 solid transparent`,
  outline: 'none',
  borderRadius: borderRadius,
  padding: 6,
  vars: {
    [borderRadius]: '8px',
    [backdropColor]: '34 34 34',
    [backdropOpacity]: '0%',
    [backdropBlur]: '0px',
  },
  selectors: {
    [`&::backdrop`]: {
      cursor: 'zoom-out',
      WebkitBackdropFilter: `blur(${backdropBlur})`,
      backdropFilter: `blur(${backdropBlur})`,
      backgroundColor: `rgb(${backdropColor} / ${backdropOpacity})`,
    },
    [`${whereLight} &`]: {
      vars: {
        [backdropBlur]: '15 15 15',
      },
    },
  },
  '@media': {
    [mantine.smallerThan('md')]: {
      borderRadius: mantine.radius.sm,
      inset: '2rem',
      width: 'calc(100vw - 4rem)',
      height: 'calc(100vh - 4rem)',
    },
    [mantine.smallerThan('sm')]: {
      border: 'none',
      inset: 0,
      width: '100vw',
      height: '100vh',
    },
  },
})

export const body = style({
  position: 'relative',
  containerName: 'overlay-dialog',
  containerType: 'size',
  border: `0 solid transparent`,
  borderRadius: calc(borderRadius).subtract('2px').toString(),
  backgroundColor: mantine.colors.body,
  overflow: 'hidden',
  width: '100%',
  height: '100%',
})
