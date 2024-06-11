import { rem } from '@mantine/core'
import { createVar, fallbackVar, generateIdentifier, globalKeyframes, globalStyle, style } from '@vanilla-extract/css'
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

export const dimmed = style({
  filter: vars.filterDimmed
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
// globalStyle(`:where([data-mantine-color-scheme="dark"]) .react-flow__edges > svg`, {
//   mixBlendMode: 'lighten'
// })

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

export const controlPoint = style({
  fill: xyvars.edge.stroke,
  stroke: xyvars.edge.stroke,
  fillOpacity: 0.75,
  strokeWidth: 1,
  cursor: 'grab',
  pointerEvents: 'visible',
  selectors: {
    [`:where(${isSelected}, [data-edge-active='true'], [data-edge-hovered='true']) &`]: {
      transition: 'all 150ms ease-out',
      fillOpacity: 1,
      strokeWidth: 3
    }
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
      animationDelay: '350ms',
      transition: 'all 130ms ease-out'
    },
    [`:where(${isSelected}, [data-edge-active='true']) &`]: {
      animationName: strokeKeyframes,
      animationDelay: '0ms',
      transition: 'all 130ms ease-out'
    },
    [`:where([data-edge-dir='back']) &`]: {
      animationDirection: 'reverse'
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
    [varTranslate]: `translate(${fallbackVar(varLabelX, '50%')}, ${fallbackVar(varLabelY, '50%')})`
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
