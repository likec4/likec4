import { style } from '@vanilla-extract/css'
import { mantine, transitions, vars, whereDark, xyvars } from '../../../theme-vars'
import { mixColor } from '../../Overlays.css'

export const elementNode = style({
  width: '100%',
  height: '100%'
})

export const elementNodeContent = style({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  gap: 6,
  padding: 16
})

export const elementNodeTitle = style({
  flex: '0 0 auto',
  width: 'fit-content',
  textAlign: 'center',
  fontFamily: vars.element.font,
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  fontWeight: 500,
  fontSize: 17,
  lineHeight: 1.25,
  textWrap: 'balance',
  color: vars.element.hiContrast
})

export const elementNodeDescription = style({
  flex: '0 0 auto',
  width: 'fit-content',
  textAlign: 'center',
  fontFamily: vars.element.font,
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  fontSize: mantine.fontSizes.xs,
  lineHeight: 1.25,
  textWrap: 'balance',
  color: vars.element.loContrast
})

export const compoundNodeBody = style({
  width: '100%',
  height: '100%',
  boxShadow: '0 4px 10px 0.5px rgba(0,0,0,0.1) , 0 2px 2px -1px rgba(0,0,0,0.4)',
  background: `color-mix(in srgb , ${vars.element.fill},  transparent 10%)`,
  borderRadius: 4
})

export const compoundNodeTitle = style({
  fontFamily: vars.compound.font,
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  fontWeight: 600,
  fontSize: 14,
  lineHeight: 1,
  textTransform: 'uppercase',
  paddingTop: 12,
  paddingLeft: 10,
  mixBlendMode: 'screen',
  color: vars.compound.titleColor
})

export const cssShapeSvg = style({
  top: 0,
  left: 0,
  position: 'absolute',
  pointerEvents: 'none',
  fill: vars.element.fill,
  stroke: vars.element.stroke,
  overflow: 'visible',
  filter: `
      drop-shadow(0 2px 1px rgba(0, 0, 0, 0.21))
      drop-shadow(0 1px 1px color-mix(in srgb, ${vars.element.stroke} 40%, transparent))
      drop-shadow(0 5px 3px rgba(0, 0, 0, 0.1))
    `,
  zIndex: -1
})

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
