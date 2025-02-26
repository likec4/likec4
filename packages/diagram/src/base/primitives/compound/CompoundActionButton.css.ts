import { style } from '@vanilla-extract/css'
import { transitions, vars } from '../../../theme-vars'

export const container = style({
  position: 'absolute',
  top: 4,
  // transform: 'translateY(-100%)',
  left: 2,
  // minHeight: 28,
  // display: 'flex',
  // justifyContent: 'center',
  // alignItems: 'center',
  zIndex: 10,
})

export const actionButton = style({
  width: 'min-content',
  height: 'min-content',
  // display: 'flex',
  // justifyContent: 'center',
  // alignItems: 'center',
})

export const actionIcon = style({
  opacity: 0.45,
  color: `var(--_compound-title-color,${vars.element.loContrast})`,
  transition: transitions.fast,
  'vars': {
    '--ai-color-hover': vars.element.hiContrast,
    '--ai-bg-idle': `color-mix(in srgb , ${vars.element.fill},  transparent 99%)`,
    '--ai-bg': `var(--ai-bg-idle)`,
    '--ai-bg-hover': `color-mix(in srgb , ${vars.element.fill} 65%, ${vars.element.stroke})`,
    '--ai-hover': `color-mix(in srgb , ${vars.element.fill} 50%, ${vars.element.stroke})`,
  },
  background: `var(--ai-bg)`,
  boxShadow: '1px 1px 3px 0px transparent',
  selectors: {
    [`:where([data-mantine-color-scheme='light'] [data-compound-transparent="true"]) &`]: {
      opacity: 0.85,
      vars: {
        '--ai-bg-hover': `color-mix(in srgb , ${vars.element.fill},  transparent 20%)`,
        '--ai-hover': `color-mix(in srgb , ${vars.element.fill},  transparent 10%)`,
        '--ai-bg': `color-mix(in srgb , ${vars.element.fill},  transparent 99%)`,
      },
    },
    [`:where([data-hovered='true']) &`]: {
      opacity: 1,
      transitionDelay: '100ms',
      transitionDuration: '300ms',
      // boxShadow: '1px 1px 3px 0px rgba(0, 0, 0, 0.15)',
      // color: `var(--ai-color-hover)`,
      // vars: {
      //   '--ai-bg': `var(--ai-bg-hover)`,
      // },
    },
  },
})
