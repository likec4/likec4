import { style } from "@vanilla-extract/css"
import { mantine, vars } from '../../../theme-vars'

export const bottomButtonsContainer = style({
  zIndex: 100,
  position: 'absolute',
  left: 0,
  width: '100%',
  bottom: 2,
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'nowrap',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
  selectors: {
    [`:where([data-likec4-shape='browser']) &`]: {
      bottom: 4
    }
  }
})

export const bottomButton = style({
  opacity: 0.7,
  pointerEvents: 'all',
  cursor: 'pointer',
  transform: 'scale(0.9)',
  transition: 'all 190ms cubic-bezier(0.5, 0, 0.4, 1)',
  backgroundColor: 'var(--ai-bg)',
  'vars': {
    '--ai-bg-idle': `color-mix(in srgb , ${vars.element.fill}, ${vars.element.stroke}, transparent 99%)`,
    '--ai-bg': `var(--ai-bg-idle)`,
    '--ai-bg-hover': `color-mix(in srgb , ${vars.element.fill} 65%, ${vars.element.stroke})`,
    '--ai-hover': `color-mix(in srgb , ${vars.element.fill} 50%, ${vars.element.stroke})`
  },
  ':hover': {
    transitionDelay: '0ms',
    transform: 'scale(1.25)',
    boxShadow: mantine.shadows.lg
  },
  ':active': {
    transform: 'scale(0.975)'
  }
})
