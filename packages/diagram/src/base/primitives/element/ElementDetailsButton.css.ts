import { style } from '@vanilla-extract/css'
import { reactFlowReducedGraphics } from '../../../LikeC4Diagram.css'
import { vars } from '../../../theme-vars'

export const container = style({
  position: 'absolute',
  top: 2,
  right: 2,
  selectors: {
    [`:where([data-likec4-shape='browser']) &`]: {
      right: 5,
    },
    ':where([data-likec4-shape="cylinder"], [data-likec4-shape="storage"]) &': {
      top: 14,
    },
    ':where([data-likec4-shape="queue"]) &': {
      top: 1,
      right: 12,
    },
  },
})

export const actionIconWrapper = style({
  width: 'min-content',
  height: 'min-content',
  // display: 'flex',
  // justifyContent: 'center',
  // alignItems: 'center',
})

export const actionIcon = style({
  pointerEvents: 'all',
  color: vars.element.loContrast,
  cursor: 'pointer',
  'vars': {
    '--ai-bg-idle': `color-mix(in srgb , ${vars.element.fill},  transparent 99%)`,
    '--ai-bg': `var(--ai-bg-idle)`,
    '--ai-bg-hover': `color-mix(in srgb , ${vars.element.fill} 65%, ${vars.element.stroke})`,
    '--ai-hover': `color-mix(in srgb , ${vars.element.fill} 50%, ${vars.element.stroke})`,
  },
  boxShadow: '1px 1px 3px 0px transparent',
  ':hover': {
    boxShadow: '1px 1px 3px 0px rgba(0, 0, 0, 0.15)',
  },
  selectors: {
    [`${reactFlowReducedGraphics} &`]: {
      boxShadow: 'none',
    },
  },
})
