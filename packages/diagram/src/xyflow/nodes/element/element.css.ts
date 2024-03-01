import {
  assignVars,
  createVar,
  fallbackVar,
  generateIdentifier,
  globalKeyframes,
  globalStyle,
  style
} from '@vanilla-extract/css'
import { vars } from '../../../theme'

const stokeFillMix = createVar('stroke-fill-mix')
// assignVars

export const container = style({
  position: 'relative',
  width: ['100%', '-webkit-fill-available'],
  height: ['100%', '-webkit-fill-available'],
  vars: {
    [stokeFillMix]: `color-mix(in srgb, ${vars.element.stroke} 65%, ${vars.element.fill})`
  }
})

const indicatorKeyframes = generateIdentifier('indicator')
globalKeyframes(indicatorKeyframes, {
  'from': {
    opacity: '0.6'
  },
  'to': {
    opacity: '0.4'
  }
})

export const indicator = style({
  // stroke: fallbackVar('var(--likec4-element-indicator)', vars.element.loContrast),
  stroke: fallbackVar(vars.element.loContrast),
  transformOrigin: 'center center',
  strokeWidth: '6px',
  animationDuration: '800ms',
  animationName: indicatorKeyframes,
  animationIterationCount: 'infinite',
  animationDirection: 'alternate',
  visibility: 'hidden',
  selectors: {
    ':where([data-likec4-shape="queue"], [data-likec4-shape="cylinder"], [data-likec4-shape="storage"]) &': {
      strokeWidth: 10
    }
  }
})

globalStyle(`.react-flow__node.selected ${indicator}`, {
  visibility: 'visible'
})

export const fillElementFill = style({
  fill: vars.element.fill
})

export const fillElementStroke = style({
  fill: vars.element.stroke
})

export const fillMixStroke = style({
  fill: stokeFillMix
})
