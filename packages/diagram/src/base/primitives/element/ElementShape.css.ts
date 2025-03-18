import { css } from '@likec4/styles/css'

export const indicator = css({
  _smallZoom: {
    visibility: 'hidden',
  },
  stroke: 'likec4.element.loContrast',
  fill: '[none]',
  animationStyle: 'indicator',
  strokeWidth: 6,
  strokeOpacity: 0.8,
  visibility: 'hidden',
  pointerEvents: 'none',
  _light: {
    stroke: `[color-mix(in srgb, {colors.likec4.element.fill} 50%,rgb(121, 121, 121))]`,
  },
  _whenSelected: {
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
  _shapeQueue: {
    strokeWidth: 8,
  },
  _shapeCylinder: {
    strokeWidth: 8,
  },
  _shapeStorage: {
    strokeWidth: 8,
  },
})

export const fillElementFill = css({
  fill: 'likec4.element.fill',
})

export const fillElementStroke = css({
  fill: 'likec4.element.stroke',
})

export const fillMixStroke = css({
  fill: '[color-mix(in srgb, {colors.likec4.element.stroke} 90%, {colors.likec4.element.fill})]',
})

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
  transition: `fill 120ms linear, filter 130ms {easings.inOut}`,
  transitionDelay: '0ms',
  filter: `
      drop-shadow(0 2px 1px rgba(0, 0, 0, 0.21))
      drop-shadow(0 1px 1px color-mix(in srgb, {colors.likec4.element.stroke} 40%, transparent))
      drop-shadow(0 5px 3px rgba(0, 0, 0, 0.1))
    `,
  _whenHovered: {
    filter: `
        drop-shadow(0 2px 1px rgba(0, 0, 0, 0.25))
        drop-shadow(0 8px 3px rgba(0, 0, 0, 0.1))
        drop-shadow(0 10px 10px rgba(0, 0, 0, 0.05))
        `,
  },
  [`:where([data-likec4-level='true']) &`]: {
    filter: `
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
