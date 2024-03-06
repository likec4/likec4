import { rem } from '@mantine/core'
import { globalStyle, style } from '@vanilla-extract/css'
import { vars, xyvars } from '../../theme'

export const container = style({
  vars: {
    [xyvars.edge.stroke]: vars.relation.lineColor,
    [xyvars.edge.strokeSelected]: `color-mix(in srgb, ${vars.relation.lineColor} 50%, white)`,
    [xyvars.edge.labelColor]: vars.relation.labelColor,
    '--text-color': vars.relation.labelColor,
    [xyvars.edge.labelBgColor]: `color-mix(in srgb, ${vars.relation.labelBgColor} 20%, transparent)`,
    // [xyvars.edge.labelBgColor]: `#6f6c6cde`,
    [xyvars.edge.strokeWidth]: '2'
  }
})

globalStyle(`${container}[data-edge-hovered='true']`, {
  vars: {
    [xyvars.edge.stroke]: `color-mix(in srgb, ${vars.relation.lineColor} 70%, white)`
  }
})

globalStyle(`.react-flow__edge.selected ${container}`, {
  vars: {
    [xyvars.edge.strokeWidth]: '2.5'
  }
})

globalStyle(`.react-flow__edges > svg`, {
  mixBlendMode: 'luminosity'
})

export const edgePathBg = style({
  strokeWidth: `calc(${xyvars.edge.strokeWidth} + 4)`,
  strokeOpacity: 0.12
  // vars: {
  //   [xyvars.edge.stroke]: `color-mix(in srgb, ${vars.relation.lineColor} 70%, transparent)`,
  // }
})

export const fillStrokeCtx = style({
  fill: xyvars.edge.stroke,
  stroke: xyvars.edge.stroke
})
globalStyle(`.react-flow__edge.selected ${fillStrokeCtx}`, {
  vars: {
    [xyvars.edge.stroke]: xyvars.edge.strokeSelected
  }
})

export const edgePath = style({
  // strokeWidth: `calc(${xyvars.edge.strokeWidth} + 4)`,
  // strokeOpacity: 0.12
  // vars: {
  //   [xyvars.edge.stroke]: `color-mix(in srgb, ${vars.relation.lineColor} 70%, transparent)`,
  // }
})

// .edgeLabel {
//   position: absolute;
//   pointer-events: all;
//   cursor: pointer;
//   transform-origin: 50% 50%;
//   /* transition: transform 120ms ease-out; */
//   /* isolation: auto; */
//   text-align: left;
//   /* mix-blend-mode: luminosity; */
//   /* --xy-edge-label-color: color-mix(in srgb, var(--likec4-relation-labelColor) 90%, transparent); */
//   /* --xy-edge-label-background-color: color-mix(in srgb, var(--likec4-relation-labelBg) 30%, transparent); */
//   /* --text-color: var(--likec4-relation-labelColor); */

//   &[data-edge-hovered='true'] {
//     /* transform: scale(1.05); */
//     /* transition-delay: 120ms; */
//     --text-color: color-mix(in srgb, var(--likec4-relation-labelColor) 70%, white);
//   }
// }

export const edgeLabel = style({
  position: 'absolute',
  pointerEvents: 'all',
  cursor: 'pointer',
  transformOrigin: '50% 50%',
  textAlign: 'left',
  mixBlendMode: 'lighten',
  selectors: {
    '&[data-edge-hovered="true"]': {
      vars: {
        '--text-color': `color-mix(in srgb, ${vars.relation.labelColor} 65%, white)`
      }
    }
  }
})
export const edgeLabelBody = style({
  display: 'inline-block',
  padding: '2px 5px',
  backgroundColor: xyvars.edge.labelBgColor,
  borderRadius: '3px',
  color: 'var(--text-color)',
  fontSize: rem(12),
  lineHeight: 1.2
  // mixBlendMode: "screen",
})
