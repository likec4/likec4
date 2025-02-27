import { createVar, globalStyle, style } from '@vanilla-extract/css'
import { reactFlowReducedGraphics } from '../../../LikeC4Diagram.css'
import { vars } from '../../../theme-vars'

export const container = style({
  position: 'absolute',
  top: 2,
  right: 2,
  zIndex: 10,
})

const btnColor = createVar('navigateBtnColor')
globalStyle(`${container}`, {
  vars: {
    [btnColor]: vars.element.loContrast,
  },
})
globalStyle(`:where([data-mantine-color-scheme='light'] [data-compound-transparent="true"]) ${container}`, {
  vars: {
    [btnColor]: vars.element.stroke,
  },
})

export const actionIcon = style({
  opacity: 0.4,
  pointerEvents: 'all',
  cursor: 'pointer',
  color: `var(--_compound-title-color,${btnColor})`,
  backgroundColor: 'var(--ai-bg)',
  'vars': {
    '--ai-color-hover': vars.element.hiContrast,
    '--ai-bg-idle': `color-mix(in srgb , ${vars.element.fill},  transparent 99%)`,
    '--ai-bg': `var(--ai-bg-idle)`,
    '--ai-bg-hover': `color-mix(in srgb , ${vars.element.fill} 65%, ${vars.element.stroke})`,
    '--ai-hover': `color-mix(in srgb , ${vars.element.fill} 50%, ${vars.element.stroke})`,
  },
  boxShadow: '1px 1px 3px 0px transparent',
  ':hover': {
    opacity: 1,
    boxShadow: '1px 1px 3px 0px rgba(0, 0, 0, 0.15)',
  },
  selectors: {
    [`:where([data-mantine-color-scheme='light'] [data-compound-transparent="true"]) &`]: {
      opacity: 0.6,
      vars: {
        '--ai-bg-hover': `color-mix(in srgb , ${vars.element.fill},  transparent 20%)`,
        '--ai-hover': `color-mix(in srgb , ${vars.element.fill},  transparent 10%)`,
        '--ai-bg': `color-mix(in srgb , ${vars.element.fill},  transparent 99%)`,
      },
    },
    [`${reactFlowReducedGraphics} &`]: {
      boxShadow: 'none',
    },
  },
})

export const actionIconWrapper = style({
  width: 'min-content',
  height: 'min-content',
})
