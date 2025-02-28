import { createVar, fallbackVar, style } from '@vanilla-extract/css'
import { reactFlowReducedGraphics } from '../../../LikeC4Diagram.css'
import { easings, vars } from '../../../theme-vars'

export const stokeFillMix = createVar('stroke-fill-mix')

export const container = style({
  position: 'relative',
  width: '100%',
  height: '100%',
  padding: 0,
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  vars: {
    [stokeFillMix]: `color-mix(in srgb, ${vars.element.stroke} 90%, ${vars.element.fill})`,
  },
  ':after': {
    content: ' ',
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    height: 24,
    background: 'transparent',
    pointerEvents: 'all',
  },

  selectors: {
    [`&:is([data-likec4-dimmed="true"])`]: {
      opacity: 0.25,
      transition: `opacity 400ms ${easings.inOut}, filter 500ms ${easings.inOut}`,
      transitionDelay: '50ms',
      filter: `grayscale(0.85) ${fallbackVar(vars.safariAnimationHook, 'blur(2px)')}`,
    },
    [`&:is([data-likec4-dimmed="immediate"])`]: {
      opacity: 0.25,
      transition: `opacity 100ms ${easings.inOut}, filter 100ms ${easings.inOut}`,
      filter: `grayscale(0.85) ${fallbackVar(vars.safariAnimationHook, 'blur(2px)')}`,
    },
    [`${reactFlowReducedGraphics} &:after`]: {
      display: 'none',
    },
    [`:where(.react-flow__node.selectable:not(.dragging)) &`]: {
      cursor: 'pointer',
    },
  },
})
