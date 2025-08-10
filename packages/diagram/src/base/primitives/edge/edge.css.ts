import { css } from '@likec4/styles/css'

const isSelected = '.react-flow__edge.selected'

export const edgeContainer = css({
  _reduceGraphics: {
    transition: 'none',
  },
})

const _hideOnReducedGraphics = css.raw({
  _reduceGraphicsOnPan: {
    display: 'none',
  },
  _smallZoom: {
    display: 'none',
  },
})
export const hideOnReducedGraphics = css(_hideOnReducedGraphics)

export const edgePathBg = css(_hideOnReducedGraphics, {
  fill: '[none]',
  strokeWidth: 'calc(var(--xy-edge-stroke-width) + 2)',
  strokeOpacity: 0.08,
  _noReduceGraphics: {
    transitionProperty: 'stroke-width, stroke-opacity',
    transitionDuration: 'fast',
    transitionTimingFunction: 'inOut',
  },
  _whenHovered: {
    transitionTimingFunction: 'out',
    strokeWidth: 'calc(var(--xy-edge-stroke-width) + 4)',
    strokeOpacity: 0.2,
  },
  _whenSelected: {
    strokeWidth: 'calc(var(--xy-edge-stroke-width) + 6)',
    strokeOpacity: 0.25,
    _whenHovered: {
      strokeOpacity: 0.4,
    },
  },
})

// To fix issue with marker not inheriting color from path - we need to create container
export const markerContext = css({
  fill: '[var(--xy-edge-stroke)]' as const,
  stroke: '[var(--xy-edge-stroke)]' as const,
})

export const cssEdgePath = css({
  fill: '[none!]',
  strokeDashoffset: 10,
  _noReduceGraphics: {
    transition: 'stroke 130ms ease-out,stroke-width 130ms ease-out',
  },
  [`:where([data-edge-dir='back']) &`]: {
    animationDirection: 'reverse',
  },
  _whenHovered: {
    _noReduceGraphics: {
      animationStyle: 'xyedgeAnimated',
      animationDelay: '450ms',
    },
  },
  [`:where(${isSelected}, [data-edge-active='true'], [data-edge-animated='true']) &`]: {
    _noReduceGraphics: {
      animationStyle: 'xyedgeAnimated',
      animationDelay: '0ms',
    },
  },
  _whenDimmed: {
    animationPlayState: 'paused',
  },
  _smallZoom: {
    animationName: 'none',
  },
  _whenPanning: {
    strokeDasharray: 'none !important',
    animationName: 'none',
  },
})
