import { rem } from '@mantine/core'
import { createVar, globalStyle, style } from '@vanilla-extract/css'
import { mantine } from '../../mantine.css'
import { vars, xyvars } from '../../theme.css'

export const container = style({
  vars: {
    [xyvars.edge.stroke]: vars.relation.lineColor,
    [xyvars.edge.strokeSelected]: `color-mix(in srgb, ${vars.relation.lineColor}, white 30%)`,
    [xyvars.edge.labelColor]: `color-mix(in srgb, ${vars.relation.labelColor}, rgba(255 255 255 / 0.85) 20%)`,
    [xyvars.edge.labelBgColor]: `color-mix(in srgb, ${vars.relation.labelBgColor}, transparent 35%)`,
    [xyvars.edge.strokeWidth]: '2.5px'
  },
  selectors: {
    [mantine.darkSelector]: {
      vars: {
        [xyvars.edge.labelColor]: vars.relation.labelColor,
        [xyvars.edge.labelBgColor]: `color-mix(in srgb, ${vars.relation.labelBgColor}, transparent 55%)`
      }
    }
    // [mantine.lightSelector]: {
    //   // mixBlendMode: 'luminosity',
    //   vars: {
    //     // [xyvars.edge.labelColor]: `color-mix(in srgb, ${vars.relation.labelColor}, #000 85%)`
    //   }
    // }
  }
})

globalStyle(`${container}[data-edge-hovered='true']`, {
  vars: {
    [xyvars.edge.stroke]: `color-mix(in srgb, ${vars.relation.lineColor}, white 30%)`,
    [xyvars.edge.strokeWidth]: '3px'
  }
})
// globalStyle(`${container}[data-edge-hovered='true']`, {
//   vars: {
//     [xyvars.edge.stroke]: `color-mix(in srgb, ${vars.relation.lineColor}, white 35%)`
//   },
// })

globalStyle(`.react-flow__edge.selected ${container}`, {
  vars: {
    [xyvars.edge.strokeWidth]: '2.5'
  }
})

globalStyle(`.react-flow__edges > svg`, {
  mixBlendMode: 'screen'
})
globalStyle(`:where([data-mantine-color-scheme="dark"]) .react-flow__edges > svg`, {
  mixBlendMode: 'lighten'
})

export const edgePathBg = style({
  strokeWidth: `calc(${xyvars.edge.strokeWidth} + 8)`,
  strokeOpacity: 0.1
})

export const fillStrokeCtx = style({
  fill: xyvars.edge.stroke,
  stroke: xyvars.edge.stroke,
  selectors: {
    '.react-flow__edge.selected &': {
      vars: {
        [xyvars.edge.stroke]: xyvars.edge.strokeSelected
      }
    }
  }
})

export const cssEdgePath = style({
  selectors: {
    [`${container}[data-edge-hovered='true'] &`]: {
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
  willChange: 'transform',
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
