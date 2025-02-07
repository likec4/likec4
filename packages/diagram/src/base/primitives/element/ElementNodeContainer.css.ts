import { createVar, fallbackVar, globalStyle, style } from '@vanilla-extract/css'
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
  // selectors: {
  //   ':where(.react-flow__node.selected) &': {
  //     willChange: 'transform',
  //   },
  // },
  // Catch pointer below the element
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
})

globalStyle(`.react-flow__node:has(${container}[data-likec4-dimmed="true"])`, {
  opacity: 0.25,
  transition: `opacity 400ms ${easings.inOut}, filter 500ms ${easings.inOut}`,
  transitionDelay: '50ms',
  filter: `grayscale(0.85) ${fallbackVar(vars.safariAnimationHook, 'blur(2px)')}`,
  willChange: 'opacity, filter',
})

globalStyle(`.react-flow__node:has(${container}[data-likec4-dimmed="immediate"])`, {
  opacity: 0.25,
  transition: `opacity 100ms ${easings.inOut}, filter 100ms ${easings.inOut}`,
  filter: `grayscale(0.85) ${fallbackVar(vars.safariAnimationHook, 'blur(2px)')}`,
  willChange: 'opacity, filter',
})
