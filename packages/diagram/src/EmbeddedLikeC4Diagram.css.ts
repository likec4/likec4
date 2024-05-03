import { style } from '@vanilla-extract/css'
import { mantine } from './mantine.css'

export const modalContent = style({
  backgroundColor: 'transparent'
  // backgroundColor: `color-mix(in srgb, ${mantine.colors.dark[7]}, transparent 50%)`,
  // backdropFilter: 'blur(2px)',
})

export const modalBody = style({
  padding: 0,
  height: '100%'
})

export const modalHeader = style({
  position: 'absolute',
  top: '1rem',
  left: '1rem'
})

export const modalCloseButtonBox = style({
  position: 'absolute',
  top: '1rem',
  right: '1rem'
})

export const modalCloseButton = style({
  '@media': {
    [mantine.largerThan('md')]: {
      vars: {
        ['--cb-size']: 'var(--cb-size-lg)'
      }
    }
  }
})
