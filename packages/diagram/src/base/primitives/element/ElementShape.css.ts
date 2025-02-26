import { createVar, fallbackVar, globalStyle, keyframes, style } from '@vanilla-extract/css'
import { hiddenIfZoomTooSmall } from '../../../LikeC4Diagram.css'
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

const shapeBase = style({
  top: 0,
  left: 0,
  position: 'absolute',
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  fill: vars.element.fill,
  stroke: vars.element.stroke,
  overflow: 'visible',
  zIndex: -1,
})

export const shapeSvgMultiple = style([shapeBase, hiddenIfZoomTooSmall, {
  transformOrigin: '50% 25%',
  transform: 'translate(14px, 14px) perspective(300px) translateZ(-8px)',
  filter: ' brightness(0.65) saturate(0.8)',
  stroke: 'none',
  selectors: {
    // [`:where(.react-flow__node.selected, .react-flow__node:focus-visible, ${container}:focus-visible) &`]: {
    //   visibility: 'hidden',
    // },
    ':where([data-likec4-shape="cylinder"], [data-likec4-shape="storage"]) &': {
      transformOrigin: '50% 100%',
    },
    ':where([data-likec4-shape="queue"]) &': {
      transformOrigin: '75% 25%',
      // transform: 'translate(14px,15px) perspective(200px) translateZ(-2px)',
    },
  },
  // filter: 'brightness(0.5)'
}])
globalStyle(`.${shapeSvgMultiple} ${fillMixStroke}`, {
  fill: vars.element.fill,
})
export const shapeSvg = style([shapeBase, {
  filter: filterShadow,
  transition: `fill 120ms linear, filter 130ms ${easings.inOut}`,
  transitionDelay: '0ms',
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
        drop-shadow(0 2px 1px rgba(0, 0, 0, 0.25))
        drop-shadow(0 8px 3px rgba(0, 0, 0, 0.1))
        drop-shadow(0 10px 10px rgba(0, 0, 0, 0.05))

        `,
      },
    },
    [`:where(.react-flow__node.selected, .react-flow__node:focus-visible, ${container}:focus-visible) &`]: {
      vars: {
        [filterShadow]: `none`,
      },
    },
    [`:where([data-likec4-zoom-small="true"]) &`]: {
      vars: {
        [filterShadow]: `none`,
      },
    },
  },
}])
