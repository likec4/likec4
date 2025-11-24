import { defineParts, defineRecipe } from '@pandacss/dev'

const parts = defineParts({
  root: { selector: '&' },
  path: { selector: '& .likec4-edge-path' },
  markers: { selector: '& .likec4-edge-markers' },
  pathBg: { selector: '& .likec4-edge-path-bg' },
  middlePoint: { selector: '& .likec4-edge-middle-point' },
})

const isSelected = '.react-flow__edge.selected'

export const edgeContainer = defineRecipe({
  description: 'Recipe for Edge Container',
  className: 'likec4-edge-container',
  jsx: [],
  base: parts({
    root: {
      _reduceGraphics: {
        transition: 'none',
      },
    },
    pathBg: {
      pointerEvents: 'none',
      fill: 'none',
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
    },

    // To fix issue with marker not inheriting color from path - we need to create container
    markers: {
      fill: '[var(--xy-edge-stroke)]' as const,
      stroke: '[var(--xy-edge-stroke)]' as const,
    },

    path: {
      fill: 'none',
      strokeDashoffset: 0,
      _noReduceGraphics: {
        animationStyle: 'xyedgeAnimated',
        animationPlayState: 'paused',
        transition: 'stroke 130ms ease-out,stroke-width 130ms ease-out',
      },
      [`:where([data-edge-dir='back']) &`]: {
        animationDirection: 'reverse',
      },
      _whenHovered: {
        _noReduceGraphics: {
          animationPlayState: 'running',
          animationDelay: '450ms',
        },
      },
      [`:where(${isSelected}, [data-edge-active='true'], [data-edge-animated='true']) &`]: {
        _noReduceGraphics: {
          animationPlayState: 'running',
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
        animationPlayState: 'paused',
      },
    },

    middlePoint: {
      visibility: 'hidden',
      offsetDistance: '50%',
      cx: 0,
      cy: 0,
      r: 4,
      pointerEvents: 'none',
    },
  }),
  staticCss: [{
    conditions: ['*'],
  }],
})
