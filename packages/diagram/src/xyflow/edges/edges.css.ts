import { rem } from '@mantine/core'
import { globalStyle, style } from '@vanilla-extract/css'
import { vars, xyvars } from '../../theme'

export const container = style({
  vars: {
    [xyvars.edge.stroke]: vars.relation.lineColor,
    [xyvars.edge.strokeSelected]: `color-mix(in srgb, ${vars.relation.lineColor} 50%, white)`,
    [xyvars.edge.labelColor]: vars.relation.labelColor,
    '--text-color': vars.relation.labelColor,
    [xyvars.edge.labelBgColor]: `color-mix(in srgb, ${vars.relation.labelBgColor} 75%, transparent)`,
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
  strokeWidth: `calc(${xyvars.edge.strokeWidth} + 5)`,
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
  transition: 'stroke 120ms ease-out'
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
  mixBlendMode: 'screen',
  padding: '3px 6px',
  width: 'max-content',
  selectors: {
    '&[data-edge-hovered="true"]': {
      transition: 'all 140ms ease-out',
      transform: 'scale(1.1)',
      vars: {
        '--text-color': `color-mix(in srgb, ${vars.relation.labelColor} 50%, white)`
      }
    },
    '&::before': {
      content: '" "',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: xyvars.edge.labelBgColor,
      borderRadius: '3px',
      zIndex: -1
    }
  }
})
// globalStyle(`${fillStrokeCtx}`, {
//   vars: {
//     [xyvars.edge.stroke]: xyvars.edge.strokeSelected
//   }
// })

export const edgeLabelBody = style({
  color: 'var(--text-color)',
  fontSize: rem(12),
  lineHeight: 1.1,
  transition: 'color 120ms ease-out'
})
