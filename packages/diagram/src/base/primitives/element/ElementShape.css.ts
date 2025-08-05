import { css, cx } from '@likec4/styles/css'

export const indicator = css({
  _smallZoom: {
    visibility: 'hidden',
  },
  stroke: 'var(--likec4-palette-loContrast)',
  fill: '[none]',

  strokeWidth: 8,
  strokeOpacity: 0.8,
  visibility: 'hidden',
  pointerEvents: 'none',
  _light: {
    stroke: `[color-mix(in srgb, var(--likec4-palette-fill) 50%,rgb(121, 121, 121))]`,
  },
  _whenFocused: {
    visibility: 'visible',
  },
  _groupFocusVisible: {
    visibility: 'visible',
  },
  _whenSelected: {
    animationStyle: 'indicator',
    visibility: 'visible',
  },
})

export const fillElementFill = css({
  fill: 'var(--likec4-palette-fill)',
})

export const fillElementStroke = css({
  fill: 'var(--likec4-palette-stroke)',
})

export const fillMixStroke = css({
  fill: '[color-mix(in srgb, var(--likec4-palette-stroke) 90%, var(--likec4-palette-fill))]',
  '.shape-svg-multiple &': {
    fill: 'var(--likec4-palette-fill)',
  },
})

const shapeBase = css.raw({
  top: '0',
  left: '0',
  position: 'absolute',
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  fill: 'var(--likec4-palette-fill)',
  stroke: 'var(--likec4-palette-stroke)',
  overflow: 'visible',
  // zIndex is removed to improve rendering performance
  // this forces to keep shape in the same layer as the node
  // zIndex: -1,
})

export const shapeSvgMultiple = cx(
  'shape-svg-multiple',
  css(shapeBase, {
    transformOrigin: {
      base: '50% 50%',
      _shapeQueue: '75% 25%',
      _shapeCylinder: '50% 100%',
      _shapeStorage: '50% 100%',
    },
    transform: 'translate(14px, 14px) perspective(300px) translateZ(-8px)',
    filter: 'brightness(0.65) saturate(0.8)',
    stroke: '[none]',
    display: {
      _smallZoom: 'none',
      _reduceGraphicsOnPan: 'none',
      _whenSelected: 'none',
      _whenFocused: 'none',
    },
  }),
)

export const shapeSvg = css(shapeBase, {
  transition: `fill 120ms linear, filter 130ms {easings.inOut}`,
  transitionDelay: '0ms',
  filter: `
      drop-shadow(0 2px 1px rgba(0, 0, 0, 0.21))
      drop-shadow(0 1px 1px color-mix(in srgb, var(--likec4-palette-stroke) 40%, transparent))
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
  _whenSelected: {
    filter: 'none',
  },
  _smallZoom: {
    filter: 'none',
  },
  _whenPanning: {
    transition: 'none',
    filter: 'none',
  },
})
