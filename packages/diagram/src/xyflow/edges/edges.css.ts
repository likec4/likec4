import { rem } from '@mantine/core'
import { createVar, generateIdentifier, globalKeyframes, globalStyle, style } from '@vanilla-extract/css'
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

globalStyle(`${container}[data-edge-hovered='true']`, {
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
globalStyle(`:where([data-mantine-color-scheme="dark"]) .react-flow__edges > svg`, {
  mixBlendMode: 'lighten'
})

export const edgePathBg = style({
  strokeWidth: xyvars.edge.strokeWidth,
  strokeOpacity: 0.05,
  // transition: 'stroke-width 175ms ease-in-out',
  // transition: 'stroke-width 175ms ease-in-out, stroke-opacity 150ms ease-out',
  transitionProperty: 'stroke-width, stroke-opacity',
  transitionDuration: '155ms',
  transitionTimingFunction: 'ease-out',
  selectors: {
    [`:where(${isSelected}, [data-edge-hovered='true']) &`]: {
      strokeWidth: `calc(${xyvars.edge.strokeWidth} + 8px)`,
      strokeOpacity: 0.11
    }
  }
})

export const fillStrokeCtx = style({
  fill: xyvars.edge.stroke,
  stroke: xyvars.edge.stroke
})

export const controlPoint = style({
  fill: xyvars.edge.stroke,
  stroke: xyvars.edge.stroke
})

globalStyle(`:where(${isSelected}) ${fillStrokeCtx}`, {
  vars: {
    [xyvars.edge.stroke]: xyvars.edge.strokeSelected
  }
})

const strokeKeyframes = generateIdentifier('strokeKeyframes')
globalKeyframes(strokeKeyframes, {
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
  selectors: {
    [`:where([data-edge-hovered='true']) &`]: {
      animationName: strokeKeyframes,
      animationDelay: '500ms',
      transition: 'all 130ms ease-out'
    },
    [`:where(${isSelected}) &`]: {
      animationName: strokeKeyframes,
      animationDelay: '0ms',
      transition: 'all 130ms ease-out'
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
  textAlign: 'left',
  mixBlendMode: 'screen',
  padding: '2px 6px 4px 6px',
  width: 'max-content',
  backgroundColor: xyvars.edge.labelBgColor,
  borderRadius: '3px',
  transform: varTranslate,
  backfaceVisibility: 'hidden',
  vars: {
    // [varTranslate]: `translate(calc(${varLabelX} - 50%), calc(${varLabelY} - 50%))`,
    [varTranslate]: `translate(${varLabelX}, ${varLabelY})`,
    [varLabelX]: '50%',
    [varLabelY]: '50%'
  },
  selectors: {
    // [mantine.darkSelector]: {
    //   mixBlendMode: 'luminosity'
    // },
    '&[data-edge-hovered="true"]': {
      transition: 'all 140ms ease-out',
      transform: `${varTranslate} scale(1.1)`
    }
  }
})

export const edgeLabelBody = style({
  // display: 'inline',
  color: xyvars.edge.labelColor,
  fontSize: rem(12.5),
  lineHeight: 1.12,
  transition: 'color 120ms ease-out'
})
