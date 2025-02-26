import { createVar, fallbackVar, globalStyle, keyframes, style } from '@vanilla-extract/css'
import { cssReactFlow, hiddenIfZoomTooSmall } from '../../../LikeC4Diagram.css'
import { vars, xyvars } from '../../../theme-vars'
import { whereDark, whereLight } from '../../../theme-vars.css'

export const mixColor = createVar('mix-color')

export const dimmed = style({})

export const edgeVars = style({
  vars: {
    [mixColor]: `black`,
    [xyvars.edge.stroke]: vars.relation.lineColor,
    [xyvars.edge.strokeSelected]: `color-mix(in srgb, ${vars.relation.lineColor}, ${mixColor} 35%)`,
    [xyvars.edge.labelColor]: `color-mix(in srgb, ${vars.relation.labelColor}, rgba(255 255 255 / 0.85) 40%)`,
    [xyvars.edge.labelBgColor]: `color-mix(in srgb, ${vars.relation.labelBgColor}, transparent 40%)`,
    [xyvars.edge.strokeWidth]: '3',
  },
})

export const edgeContainer = style([edgeVars, {
  selectors: {
    [`&:is(${dimmed})`]: {
      opacity: 0.6,
      transition: 'opacity 600ms ease-in-out, filter 600ms ease-in-out',
      transitionDelay: '200ms',
      filter: `grayscale(0.85) ${fallbackVar(vars.safariAnimationHook, 'blur(1px)')}`,
    },
  },
}])

globalStyle(`${whereDark} ${edgeVars}`, {
  vars: {
    [mixColor]: `white`,
    [xyvars.edge.labelColor]: vars.relation.labelColor,
    [xyvars.edge.labelBgColor]: `color-mix(in srgb, ${vars.relation.labelBgColor}, transparent 50%)`,
  },
})

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

globalStyle(`${cssReactFlow}:is([data-likec4-enable-mix-blend]) .react-flow__edges > svg`, {
  mixBlendMode: 'plus-lighter',
})
globalStyle(`${whereLight} ${cssReactFlow}:is([data-likec4-enable-mix-blend]) .react-flow__edges > svg`, {
  mixBlendMode: 'screen',
})

export const edgePathBg = style([hiddenIfZoomTooSmall, {
  // strokeWidth: xyvars.edge.strokeWidth,
  strokeOpacity: 0.08,
  // transition: 'stroke-width 175ms ease-in-out',
  // transition: 'stroke-width 175ms ease-in-out, stroke-opacity 150ms ease-out',
  transitionProperty: 'stroke-width, stroke-opacity',
  transitionDuration: '155ms',
  transitionTimingFunction: 'ease-out',
  selectors: {
    [`:where(${isSelected}, [data-edge-active='true'], [data-edge-hovered='true']) &`]: {
      strokeWidth: `calc(${xyvars.edge.strokeWidth} + 8)`,
      strokeOpacity: 0.15,
    },
  },
}])

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
    [`:where([data-edge-hovered='true']) &`]: {
      animationName: strokeKeyframes,
      animationDelay: '450ms',
      transition: 'stroke 130ms ease-out,stroke-width 130ms ease-out',
    },
    [`:where(${isSelected}, [data-edge-active='true'], [data-edge-animated='true']) &`]: {
      animationName: strokeKeyframes,
      animationDelay: '0ms',
      transition: 'stroke 130ms ease-out,stroke-width 130ms ease-out',
    },
    [`:where([data-edge-dir='back']) &`]: {
      animationDirection: 'reverse',
    },
    [`${dimmed} &`]: {
      animationPlayState: 'paused',
    },
  },
})
