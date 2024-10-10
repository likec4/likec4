import { createVar, keyframes, style } from '@vanilla-extract/css'
import { whereDark } from '../theme-vars'

const dialogFadeIn = keyframes({
  '0%': {
    opacity: 0,
    transform: 'scale(0.75)',
    display: 'none'
  },
  '100%': {
    opacity: 1,
    transform: 'scale(1)',
    display: 'block'
  }
})

const dialogFadeOut = keyframes({
  '0%': {
    opacity: 1,
    transform: 'scale(1)',
    display: 'block'
  },
  '100%': {
    opacity: 0,
    transform: 'scale(0.95)',
    display: 'none'
  }
})

const backdropRgb = createVar('backdrop-rgb')

const dialogBackdropFadeIn = keyframes({
  '0%': {
    WebkitBackdropFilter: 'blur(1px)',
    backdropFilter: 'blur(1px)',
    backgroundColor: `rgb(${backdropRgb} / 30%)`
  },
  '100%': {
    WebkitBackdropFilter: 'blur(8px)',
    backdropFilter: 'blur(8px)',
    backgroundColor: `rgb(${backdropRgb} / 80%)`
  }
})

export const dialog = style({
  top: 0,
  left: 0,
  padding: 0,
  margin: 'auto',
  boxSizing: 'border-box',
  border: '0 solid transparent',
  width: '100%',
  minWidth: '100dvw',
  height: '100%',
  minHeight: '100dvh',
  background: 'transparent',
  animation: `${dialogFadeOut} 160ms cubic-bezier(0.50, 0, 1, 1)`,
  transformOrigin: '50% 10%',
  vars: {
    [backdropRgb]: '255 255 255'
  },
  selectors: {
    [`${whereDark} &`]: {
      vars: {
        [backdropRgb]: '36 36 36'
      }
    },
    '&[open]': {
      animation: `${dialogFadeIn} 220ms cubic-bezier(0, 0, 0.40, 1)`
    },
    '&::backdrop': {
      WebkitBackdropFilter: 'blur(1px)',
      backdropFilter: 'blur(1px)',
      backgroundColor: `rgb(${backdropRgb} / 30%)`
    },
    '&[open]::backdrop': {
      animation: `${dialogBackdropFadeIn} 350ms cubic-bezier(0, 0, 0.40, 1) forwards`
    }
  }
})
