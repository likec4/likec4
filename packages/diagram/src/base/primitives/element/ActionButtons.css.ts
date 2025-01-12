import { style } from '@vanilla-extract/css'
import { transitions, vars } from '../../../theme-vars'

export const container = style({
  position: 'absolute',
  top: `calc(100% - 28px)`,
  // transform: 'translateY(-100%)',
  left: 0,
  width: '100%',
  minHeight: 28,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 10,
})

export const actionButtons = style({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
})

export const actionIcon = style({
  color: vars.element.loContrast,
  opacity: 0.75,
  transition: transitions.fast,
  'vars': {
    '--ai-bg-idle': `color-mix(in srgb , ${vars.element.fill},  transparent 99%)`,
    '--ai-bg-container-hover': `color-mix(in srgb , ${vars.element.fill},  transparent 50%)`,
    '--ai-bg': `var(--ai-bg-idle)`,
    '--ai-bg-hover': `color-mix(in srgb , ${vars.element.fill} 65%, ${vars.element.stroke})`,
    '--ai-hover': `color-mix(in srgb , ${vars.element.fill} 50%, ${vars.element.stroke})`,
  },
  background: `var(--ai-bg)`,
  selectors: {
    [`:where([data-hovered='true']) &`]: {
      opacity: 1,
      vars: {
        '--ai-bg': `var(--ai-bg-hover)`,
      },
    },
  },
})
// globalStyle(`${actionIcon} > *`, {
//   pointerEvents: 'none',
// })
