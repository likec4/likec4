import { createVar, fallbackVar, keyframes, style } from '@vanilla-extract/css'
import { easings, mantine, vars } from '../../../theme-vars'
import { container, stokeFillMix } from './ElementNodeContainer.css'

const indicatorKeyframes = keyframes({
  'from': {
    strokeOpacity: 0.8,
  },
  'to': {
    strokeOpacity: 0.5,
  },
})

const outlineColor = fallbackVar(
  mantine.colors.primaryColors.outline,
  mantine.colors.primaryColors.filled,
  vars.element.stroke,
)

const indicatorStroke = createVar('indicator-stroke')

export const indicator = style({
  stroke: indicatorStroke,
  fill: 'none',
  transformOrigin: 'center center',
  strokeWidth: 6,
  animationDuration: '1s',
  animationIterationCount: 'infinite',
  animationDirection: 'alternate',
  strokeOpacity: 0.8,
  visibility: 'hidden',
  pointerEvents: 'none',
  vars: {
    [indicatorStroke]: vars.element.loContrast,
  },
  selectors: {
    ':where(.react-flow__node.selected) &': {
      visibility: 'visible',
      animationName: fallbackVar(vars.safariAnimationHook, indicatorKeyframes),
    },
    [`:where(.react-flow__node:focus-visible, ${container}:focus-visible) &`]: {
      strokeWidth: 10,
      stroke: outlineColor,
      visibility: 'visible',
    },
    ':where([data-likec4-shape="queue"], [data-likec4-shape="cylinder"], [data-likec4-shape="storage"]) &': {
      strokeWidth: 10,
    },
    [`:where([data-mantine-color-scheme='light']) &`]: {
      vars: {
        [indicatorStroke]: `color-mix(in srgb, ${vars.element.fill} 50%, #3c3c3c)`,
      },
    },
  },
})

export const fillElementFill = style({
  fill: vars.element.fill,
})

export const fillElementStroke = style({
  fill: vars.element.stroke,
})

export const fillMixStroke = style({
  fill: fallbackVar(stokeFillMix, `color-mix(in srgb, ${vars.element.stroke} 90%, ${vars.element.fill})`),
})

const filterShadow = createVar('filter-shadow')

export const shapeSvgMultiple = style({
  top: 0,
  left: 0,
  position: 'absolute',
  pointerEvents: 'none',
  transformOrigin: '50% 50%',
  fill: vars.element.fill,
  stroke: 'none',
  zIndex: -1,
  transition: 'opacity 500ms ease-out',
  transform: 'translate(8px,10px)',
  opacity: 0.5,
  selectors: {
    [`:where(.react-flow__node.selected, .react-flow__node:focus-visible, ${container}:focus-visible) &`]: {
      visibility: 'hidden',
    },
    ':where([data-likec4-shape="cylinder"], [data-likec4-shape="storage"]) &': {
      transform: 'translate(8px,8px)',
    },
    ':where([data-likec4-shape="queue"]) &': {
      transform: 'translate(-10px,8px)',
    },
  },
})
export const shapeSvg = style({
  top: 0,
  left: 0,
  position: 'absolute',
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  fill: vars.element.fill,
  stroke: vars.element.stroke,
  overflow: 'visible',
  filter: filterShadow,
  transition: `filter 130ms ${easings.inOut}`,
  transitionDelay: '0ms',
  zIndex: -1,
  vars: {
    [filterShadow]: `
      drop-shadow(0 2px 1px rgba(0, 0, 0, 0.21))
      drop-shadow(0 1px 1px color-mix(in srgb, ${vars.element.stroke} 40%, transparent))
      drop-shadow(0 5px 3px rgba(0, 0, 0, 0.1))
    `,
  },
  selectors: {
    [`:where([data-hovered='true']) &`]: {
      vars: {
        [filterShadow]: `
          drop-shadow(0 5px 3px rgba(0, 0, 0, 0.2))
          drop-shadow(0 12px 10px rgba(0, 0, 0, 0.12))
        `,
      },
    },
    [`:where(.react-flow__node.selected, .react-flow__node:focus-visible, ${container}:focus-visible) &`]: {
      vars: {
        [filterShadow]: `none`,
      },
    },
  },
})
