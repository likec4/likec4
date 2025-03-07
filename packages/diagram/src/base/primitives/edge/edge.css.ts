import { createVar, fallbackVar, globalStyle, keyframes, style } from '@vanilla-extract/css'
import {
  reactFlow,
} from '../../../LikeC4Diagram.css'
import {
  vars,
  whereDark,
  whereLight,
  whereNotReducedGraphics,
  whereReducedGraphics,
  whereSmallZoom,
  xyvars,
} from '../../../theme-vars'

export const mixColor = createVar('mix-color')

export const edgeVars = style({
  vars: {
    [mixColor]: `black`,
    [xyvars.edge.stroke]: vars.relation.lineColor,
    [xyvars.edge.strokeSelected]: `color-mix(in srgb, ${vars.relation.lineColor}, ${mixColor} 35%)`,
    [xyvars.edge.labelColor]: vars.relation.labelColor,
    [xyvars.edge.labelBgColor]: vars.relation.labelBgColor,
    [xyvars.edge.strokeWidth]: '3',
  },
  selectors: {
    [`${whereDark} &`]: {
      vars: {
        [mixColor]: `white`,
      },
    },
    [`${whereLight} ${whereNotReducedGraphics} &`]: {
      vars: {
        [xyvars.edge.labelColor]: `color-mix(in srgb, ${vars.relation.labelColor}, rgba(255 255 255 / 0.85) 40%)`,
        [xyvars.edge.labelBgColor]: `color-mix(in srgb, ${vars.relation.labelBgColor}, transparent 40%)`,
      },
    },
    [`${whereDark} ${whereNotReducedGraphics} &`]: {
      vars: {
        [xyvars.edge.labelBgColor]: `color-mix(in srgb, ${vars.relation.labelBgColor}, transparent 50%)`,
      },
    },
  },
})

export const edgeContainer = style([edgeVars, {
  selectors: {
    [`&:is([data-edge-dimmed="true"])`]: {
      opacity: 0.6,
      transition: 'opacity 600ms ease-in-out, filter 600ms ease-in-out',
      transitionDelay: '200ms',
      filter: `grayscale(0.85) ${fallbackVar(vars.safariAnimationHook, 'blur(1px)')}`,
    },
    [`&:is([data-edge-dimmed="immediate"])`]: {
      opacity: 0.25,
      transition: 'opacity 100ms ease-in-out, filter 100ms ease-in-out',
      filter: `grayscale(0.85) ${fallbackVar(vars.safariAnimationHook, 'blur(1px)')}`,
    },
    [`${whereReducedGraphics} &`]: {
      transition: 'none',
    },
  },
}])
const isSelected = '.react-flow__edge.selected'

globalStyle(`:where(${isSelected}) ${edgeVars}`, {
  vars: {
    [xyvars.edge.stroke]: xyvars.edge.strokeSelected,
    [xyvars.edge.strokeWidth]: '3',
  },
})

globalStyle(`${edgeVars}:is([data-edge-hovered='true'],[data-edge-active='true'])`, {
  vars: {
    // [xyvars.edge.stroke]: `color-mix(in srgb, ${vars.relation.lineColor}, ${mixColor} 35%)`,
    [xyvars.edge.stroke]: xyvars.edge.strokeSelected,
    [xyvars.edge.strokeWidth]: '3',
  },
})

globalStyle(`:where(${isSelected}) ${edgeVars}[data-edge-hovered='true']`, {
  vars: {
    [xyvars.edge.strokeWidth]: '4',
  },
})

globalStyle(`${reactFlow} :where(.react-flow__edges, .react-flow__edgelabel-renderer) > svg`, {
  mixBlendMode: 'plus-lighter',
})
globalStyle(`${whereLight} ${reactFlow} :where(.react-flow__edges, .react-flow__edgelabel-renderer) > svg`, {
  mixBlendMode: 'screen',
})

export const edgePathBg = style({
  // strokeWidth: xyvars.edge.strokeWidth,
  strokeOpacity: 0.08,
  // transition: 'stroke-width 175ms ease-in-out',
  // transition: 'stroke-width 175ms ease-in-out, stroke-opacity 150ms ease-out',
  transitionProperty: 'stroke-width, stroke-opacity',
  transitionDuration: '155ms',
  transitionTimingFunction: 'ease-out',
  selectors: {
    [`:where([data-likec4-zoom-small="true"]) &`]: {
      display: 'none',
    },
    [`:where(${isSelected}, [data-edge-active='true'], [data-edge-hovered='true']) &`]: {
      strokeWidth: `calc(${xyvars.edge.strokeWidth} + 8)`,
      strokeOpacity: 0.15,
    },
  },
})

// To fix issue with marker not inheriting color from path - we need to create container
export const markerContext = style({
  fill: xyvars.edge.stroke,
  stroke: xyvars.edge.stroke,
})

const strokeKeyframes = keyframes({
  'from': {
    strokeDashoffset: 18 * 2 + 10,
  },
  'to': {
    strokeDashoffset: 10,
  },
})

export const cssEdgePath = style({
  animationDuration: '800ms',
  animationIterationCount: 'infinite',
  animationTimingFunction: 'linear',
  animationFillMode: 'both',
  strokeDashoffset: 10,
  selectors: {
    [`${whereNotReducedGraphics} &`]: {
      transition: 'stroke 130ms ease-out,stroke-width 130ms ease-out',
    },
    [`:where([data-edge-hovered='true']) &`]: {
      animationName: strokeKeyframes,
      animationDelay: '450ms',
    },
    [`:where(${isSelected}, [data-edge-active='true'], [data-edge-animated='true']) &`]: {
      animationName: strokeKeyframes,
      animationDelay: '0ms',
    },
    [`:where([data-edge-dir='back']) &`]: {
      animationDirection: 'reverse',
    },
    [`:where([data-edge-dimmed]) &`]: {
      animationPlayState: 'paused',
    },
    [`${whereSmallZoom} &`]: {
      animationName: 'none',
    },
  },
})

export const looseReduce = style({
  animationName: 'none',
})
