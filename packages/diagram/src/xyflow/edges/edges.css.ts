import { rem } from '@mantine/core'
import { createVar, fallbackVar, globalStyle, keyframes, style } from '@vanilla-extract/css'
import { mantine } from '../../mantine.css'
import { vars, xyvars } from '../../theme.css'

const mixColor = createVar('mix-color')

export const container = style({
  vars: {
    [mixColor]: `black`,
    [xyvars.edge.stroke]: vars.relation.lineColor,
    [xyvars.edge.strokeSelected]: `color-mix(in srgb, ${vars.relation.lineColor}, ${mixColor} 35%)`,
    [xyvars.edge.labelColor]: `color-mix(in srgb, ${vars.relation.labelColor}, rgba(255 255 255 / 0.85) 20%)`,
    [xyvars.edge.labelBgColor]: `color-mix(in srgb, ${vars.relation.labelBgColor}, transparent 35%)`,
    [xyvars.edge.strokeWidth]: '2.2px'
  }
})

globalStyle(`:where([data-mantine-color-scheme="dark"]) ${container}`, {
  vars: {
    [mixColor]: `white`,
    [xyvars.edge.labelColor]: vars.relation.labelColor,
    [xyvars.edge.labelBgColor]: `color-mix(in srgb, ${vars.relation.labelBgColor}, transparent 55%)`
  }
})

const isSelected = '.react-flow__edge.selected'

globalStyle(`:where(${isSelected}) ${container}`, {
  vars: {
    [xyvars.edge.stroke]: xyvars.edge.strokeSelected,
    [xyvars.edge.strokeWidth]: '3px'
  }
})

globalStyle(`${container}:is([data-edge-hovered='true'],[data-edge-active='true'])`, {
  vars: {
    // [xyvars.edge.stroke]: `color-mix(in srgb, ${vars.relation.lineColor}, ${mixColor} 35%)`,
    [xyvars.edge.stroke]: xyvars.edge.strokeSelected,
    [xyvars.edge.strokeWidth]: '3px'
  }
})

globalStyle(`:where(${isSelected}) ${container}[data-edge-hovered='true']`, {
  vars: {
    [xyvars.edge.strokeWidth]: '3.6px'
  }
})
// globalStyle(`${container}[data-edge-hovered='true']`, {
//   vars: {
//     [xyvars.edge.stroke]: `color-mix(in srgb, ${vars.relation.lineColor}, white 35%)`
//   },
// })

globalStyle(`.react-flow__edges > svg`, {
  mixBlendMode: 'screen'
})

export const dimmed = style({})

globalStyle(`.react-flow__edges > svg:has(${dimmed})`, {
  opacity: 0.8,
  transition: 'opacity 600ms ease-in-out, filter 600ms ease-in-out',
  transitionDelay: '200ms',
  filter: `grayscale(0.85) ${fallbackVar(vars.safariAnimationHook, 'blur(1px)')}`,
  willChange: 'opacity, filter'
})

export const edgePathBg = style({
  strokeWidth: xyvars.edge.strokeWidth,
  strokeOpacity: 0.08,
  // transition: 'stroke-width 175ms ease-in-out',
  // transition: 'stroke-width 175ms ease-in-out, stroke-opacity 150ms ease-out',
  transitionProperty: 'stroke-width, stroke-opacity',
  transitionDuration: '155ms',
  transitionTimingFunction: 'ease-out',
  selectors: {
    [`:where(${isSelected}, [data-edge-active='true'], [data-edge-hovered='true']) &`]: {
      strokeWidth: `calc(${xyvars.edge.strokeWidth} + 8px)`,
      strokeOpacity: 0.15
    }
  }
})

// To fix issue with marker not inheriting color from path - we need to create container
export const markerContext = style({
  fill: xyvars.edge.stroke,
  stroke: xyvars.edge.stroke
})

export const controlPoint = style({
  fill: xyvars.edge.stroke,
  stroke: xyvars.edge.stroke,
  fillOpacity: 0.75,
  strokeWidth: 1,
  cursor: 'grab',
  pointerEvents: 'auto',
  visibility: 'hidden',
  ':hover': {
    stroke: mantine.colors.primaryColors.filledHover,
    strokeWidth: 9,
    transition: 'stroke 100ms ease-out, stroke-width 100ms ease-out'
  },
  selectors: {
    [`:where(${isSelected}, [data-edge-hovered='true']) &`]: {
      visibility: 'visible',
      transition: 'fill-opacity 150ms ease-out, stroke 150ms ease-out, stroke-width 150ms ease-out',
      transitionDelay: '50ms',
      fillOpacity: 1,
      strokeWidth: 5
    }
  }
})

const strokeKeyframes = keyframes({
  'from': {
    strokeDashoffset: 18 * 2
  },
  'to': {
    strokeDashoffset: 1
  }
})

export const cssEdgePath = style({
  animationDuration: '800ms',
  animationIterationCount: 'infinite',
  animationTimingFunction: 'linear',
  animationName: strokeKeyframes,
  animationPlayState: 'paused',
  selectors: {
    [`:where([data-edge-hovered='true']) &`]: {
      animationPlayState: 'running',
      animationDelay: '350ms',
      transition: 'stroke 130ms ease-out,stroke-width 130ms ease-out'
    },
    [`:where(${isSelected}, [data-edge-active='true']) &`]: {
      animationPlayState: 'running',
      animationDelay: '0ms',
      transition: 'stroke 130ms ease-out,stroke-width 130ms ease-out'
    },
    [`:where([data-edge-dir='back']) &`]: {
      animationDirection: 'reverse'
    },
    [`${dimmed} &`]: {
      animationPlayState: 'paused'
    }
  }
})

export const varLabelX = createVar('label-x')
export const varLabelY = createVar('label-y')

const varTranslate = createVar('translate')

export const edgeLabel = style({
  top: 0,
  left: 0,
  fontFamily: vars.likec4.font,
  position: 'absolute',
  pointerEvents: 'all',
  cursor: 'pointer',
  transformOrigin: '50% 50%',
  mixBlendMode: 'screen',
  color: xyvars.edge.labelColor,
  backgroundColor: xyvars.edge.labelBgColor,
  borderRadius: '3px',
  transform: varTranslate,
  vars: {
    [varTranslate]: `translate(${fallbackVar(varLabelX, '-50%')}, ${fallbackVar(varLabelY, '-50%')})`
  },
  selectors: {
    '&[data-edge-hovered="true"]': {
      transition: 'all 140ms ease-out',
      transform: `${varTranslate} scale(1.1)`
    },
    [`&:is(${dimmed})`]: {
      opacity: 0.6,
      transition: 'opacity 600ms ease-in-out, filter 600ms ease-in-out',
      transitionDelay: '200ms',
      filter: `grayscale(0.85) ${fallbackVar(vars.safariAnimationHook, 'blur(1px)')}`,
      willChange: 'opacity, filter'
    }
  }
})

export const stepEdgeNumber = style({
  position: 'absolute',
  top: -2,
  left: -2,
  fontWeight: 500,
  fontSize: rem(16),
  lineHeight: 0.9,
  padding: '4px 6px',
  borderRadius: 99999,
  textAlign: 'center',
  minWidth: 22,
  backgroundColor: xyvars.edge.labelBgColor,
  transition: 'all 120ms ease-out',
  transform: 'translateX(-100%)',
  fontVariantNumeric: 'tabular-nums',
  selectors: {
    ':where([data-edge-hovered="true"],[data-edge-active="true"]) &': {
      fontWeight: 600,
      backgroundColor: `color-mix(in srgb, ${vars.relation.labelBgColor}, transparent 5%)`
    }
  }
})

export const edgeLabelText = style({
  padding: '2px 6px 4px 6px',
  textAlign: 'left',
  fontSize: rem(12.5),
  lineHeight: 1.2
})
