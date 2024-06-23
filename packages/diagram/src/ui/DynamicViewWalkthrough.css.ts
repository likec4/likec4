import { createVar, globalStyle, style } from '@vanilla-extract/css'
import { mantine } from '../mantine.css'

export const container = style({
  position: 'absolute',
  bottom: '0.5rem',
  left: '50%',
  transform: 'translateX(-50%)',
  padding: 0,
  margin: 0
})

export const buttons = style({
  backdropFilter: 'blur(8px)',
  transition: 'all 175ms ease-in',
  ':hover': {
    transitionTimingFunction: 'ease-out',
    transform: 'scale(1.1)'
  },
  ':active': {
    transitionDuration: '100ms',
    transform: 'scale(0.98) translateY(3px)'
  }
})

var transparency = createVar()
export const btn = style({
  transition: 'all 175ms ease-in',
  backgroundColor: 'var(--button-bg)',
  vars: {
    [transparency]: '35%',
    ['--button-bg']: `color-mix(in srgb, ${mantine.colors.primaryColors.filled}, transparent ${transparency})`,
    ['--button-hover']: `color-mix(in srgb, ${mantine.colors.primaryColors.filledHover}, transparent ${transparency})`
  },
  selectors: {
    [mantine.lightSelector]: {
      vars: {
        [transparency]: '15%'
      }
    }
  }
})

globalStyle(`:where(${buttons}, ${btn}) .tabler-icon`, {
  width: '0.85em',
  height: '0.85em'
})
