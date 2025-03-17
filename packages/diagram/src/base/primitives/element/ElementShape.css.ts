// import { createVar, fallbackVar, globalStyle, keyframes, style } from '@vanilla-extract/css'
// import { hiddenIfZoomTooSmall, reactFlowReducedGraphics } from '../../../LikeC4Diagram.css'
// import { easings, mantine, vars, whereNotReducedGraphics } from '../../../theme-vars'
// import { container, stokeFillMix } from './ElementNodeContainer.css'
import { css } from '@likec4/styles/css'

// const indicatorKeyframes = keyframes({
//   'from': {
//     strokeOpacity: 0.8,
//   },
//   'to': {
//     strokeOpacity: 0.5,
//   },
// })

// const outlineColor = fallbackVar(
//   mantine.colors.primaryColors.outline,
//   mantine.colors.primaryColors.filled,
//   vars.element.stroke,
// )

const indicatorStroke = '--indicator-stroke'

export const indicator = css({
  _smallZoom: {
    visibility: 'hidden',
  },
  stroke: indicatorStroke,
  fill: 'none',
  animationStyle: 'indicator',
  strokeWidth: 6,
  strokeOpacity: 0.8,
  visibility: 'hidden',
  pointerEvents: 'none',
  [indicatorStroke]: '{colors.likec4.element.loContrast}',
  _light: {
    [indicatorStroke]: `color-mix(in srgb, {colors.likec4.element.fill} 50%, #3c3c3c)`,
  },
  ':where(.react-flow__node.selected) &': {
    visibility: 'visible',
  },
  _notReducedGraphics: {
    [`:where(.react-flow__node.selected)  &`]: {
      // animationName: fallbackVar(vars.safariAnimationHook, indicatorKeyframes),
    },
  },
  // [`:where(.react-flow__node:focus-visible, ${container}:focus-visible) &`]: {
  //   strokeWidth: 10,
  //   stroke: outlineColor,
  //   visibility: 'visible',
  // },
  ':where([data-likec4-shape="queue"], [data-likec4-shape="cylinder"], [data-likec4-shape="storage"]) &': {
    strokeWidth: 10,
  },
})

export const fillElementFill = css({
  fill: 'likec4.element.fill',
})

export const fillElementStroke = css({
  fill: 'likec4.element.stroke',
})

export const fillMixStroke = css({
  fill: 'likec4.mixStrokeFill',
})

const filterShadow = '--filter-shadow'

const shapeBase = css.raw({
  top: 0,
  left: 0,
  position: 'absolute',
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  fill: 'likec4.element.fill',
  stroke: 'likec4.element.stroke',
  overflow: 'visible',
  // zIndex is removed to improve rendering performance
  // this forces to keep shape in the same layer as the node
  // zIndex: -1,
})

export const shapeSvgMultiple = css(shapeBase, {
  transformOrigin: '50% 25%',
  transform: 'translate(14px, 14px) perspective(300px) translateZ(-8px)',
  filter: 'brightness(0.65) saturate(0.8)',
  stroke: '[none]',
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
  // filter: 'brightness(0.5)'
})
// globalStyle(`.${shapeSvgMultiple} ${fillMixStroke}`, {
//   fill: vars.element.fill,
// })
export const shapeSvg = css(shapeBase, {
  filter: `var(${filterShadow})`,
  transition: `fill 120ms linear, filter 130ms {easings.inOut}`,
  transitionDelay: '0ms',
  [filterShadow]: `
      drop-shadow(0 2px 1px rgba(0, 0, 0, 0.21))
      drop-shadow(0 1px 1px color-mix(in srgb, {colors.likec4.element.stroke} 40%, transparent))
      drop-shadow(0 5px 3px rgba(0, 0, 0, 0.1))
    `,
  _whenHovered: {
    [filterShadow]: `
        drop-shadow(0 2px 1px rgba(0, 0, 0, 0.25))
        drop-shadow(0 8px 3px rgba(0, 0, 0, 0.1))
        drop-shadow(0 10px 10px rgba(0, 0, 0, 0.05))
        `,
  },
  [`:where([data-likec4-level='true']) &`]: {
    [filterShadow]: `
        drop-shadow(0 2px 1px rgba(0, 0, 0, 0.25))
        drop-shadow(0 8px 3px rgba(0, 0, 0, 0.1))
        drop-shadow(0 10px 10px rgba(0, 0, 0, 0.05))
        `,
  },
  _smallZoom: {
    filter: 'none',
  },
  _reducedGraphics: {
    transition: 'none',
    filter: 'none',
  },
})
