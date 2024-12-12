import { style } from '@vanilla-extract/css'
import { mantine, transitions, vars, whereDark, xyvars } from '../../../theme-vars'
import { mixColor } from '../../Overlays.css'

const DimmedTransitionDelay = '400ms'

export const edgeContainer = style({
  opacity: 1,
  transition: transitions.fast,
  vars: {
    [xyvars.edge.stroke]: vars.relation.lineColor,
    [xyvars.edge.strokeSelected]: `color-mix(in srgb, ${vars.relation.lineColor}, ${mixColor} 35%)`,
    [xyvars.edge.labelColor]: `color-mix(in srgb, ${vars.relation.labelColor}, rgba(255 255 255 / 0.85) 50%)`,
    [xyvars.edge.labelBgColor]: `color-mix(in srgb, ${vars.relation.labelBgColor}, transparent 20%)`
  },
  selectors: {
    [`&[data-edge-dimmed='true']`]: {
      opacity: 0.2,
      transitionDelay: DimmedTransitionDelay
    },
    [`&[data-edge-dimmed='immediate']`]: {
      opacity: 0.2
    },
    [`${whereDark} &`]: {
      vars: {
        [xyvars.edge.labelBgColor]: `color-mix(in srgb, ${vars.relation.labelBgColor}, transparent 50%)`
      }
    }
  }
})

export const edgeLabel = style([edgeContainer, {
  padding: '2px 5px',
  fontFamily: vars.likec4.font,
  position: 'absolute',
  cursor: 'pointer',
  width: 'fit-content',
  color: xyvars.edge.labelColor,
  backgroundColor: xyvars.edge.labelBgColor,
  borderRadius: 4,
  // everything inside EdgeLabelRenderer has no pointer events by default
  // if you have an interactive element, set pointer-events: all
  pointerEvents: 'all',
  textWrap: 'pretty',
  whiteSpace: 'preserve-breaks'
}])

export const edgeLabelText = style({
  textAlign: 'center',
  whiteSpaceCollapse: 'preserve-breaks',
  fontSize: mantine.fontSizes.md,
  lineHeight: mantine.lineHeights.xs
})

export const edgeLabelTechnology = style({
  textAlign: 'center',
  whiteSpaceCollapse: 'preserve-breaks',
  fontSize: mantine.fontSizes.sm,
  lineHeight: 1
})

export const emptyNode = style({
  width: '100%',
  height: '100%',
  border: `3px dashed ${mantine.colors.defaultBorder}`,
  borderRadius: mantine.radius.md,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
})
