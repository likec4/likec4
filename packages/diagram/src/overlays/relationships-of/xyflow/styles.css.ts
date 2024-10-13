import { createVar, globalStyle, style } from '@vanilla-extract/css'
import { mantine, vars, xyvars } from '../../../theme-vars'

export const elementNode = style({
  // position: 'relative',
  width: '100%',
  height: '100%'
})

export const elementNodeContent = style({
  // position: 'relative',
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
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
  // border: `1px solid ${vars.element.stroke}`,
  background: `color-mix(in srgb , ${vars.element.fill},  transparent 50%)`,
  // background: vars.element.fill,
  borderRadius: 4
})

export const compoundNodeTitle = style({
  // flex: '0 0 auto',
  fontFamily: vars.compound.font,
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  fontWeight: 500,
  fontSize: 14,
  lineHeight: 1,
  textTransform: 'uppercase',
  paddingTop: 12,
  paddingLeft: 10,
  mixBlendMode: 'screen',
  letterSpacing: .3,
  color: vars.compound.titleColor
})

globalStyle(`:where([data-mantine-color-scheme='light']) ${compoundNodeTitle}`, {
  color: vars.element.stroke
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

export const varLabelX = createVar('label-x')
export const varLabelY = createVar('label-y')

const varTranslate = createVar('label-y')

export const edgeLabel = style({
  // top: 0,
  // left: 0,
  padding: '2px 5px',
  fontFamily: vars.likec4.font,
  position: 'absolute',
  cursor: 'pointer',
  width: 'fit-content',
  // transformOrigin: '50% 50%',
  // mixBlendMode: 'overlay',
  color: xyvars.edge.labelColor,
  backgroundColor: xyvars.edge.labelBgColor,
  borderRadius: 4,
  // everything inside EdgeLabelRenderer has no pointer events by default
  // if you have an interactive element, set pointer-events: all
  pointerEvents: 'all',
  textWrap: 'pretty',
  whiteSpace: 'preserve-breaks'
  // transform: varTranslate,
  // vars: {
  //   [varTranslate]: `translate(-50%, -50%) translate(${varLabelX},${varLabelY})`
  // },
  // selectors: {
  //   '&[data-edge-hovered="true"]': {
  //     transition: 'all 140ms ease-in-out',
  //     transform: `${varTranslate} scale(1.12)`
  //   },
  //   [`&:has(${stepEdgeNumber})`]: {
  //     padding: 0,
  //     gap: 2
  //   },
  //   [`&:is(${dimmed})`]: {
  //     opacity: 0.3,
  //     transition: 'opacity 600ms ease-in-out, filter 600ms ease-in-out',
  //     transitionDelay: '200ms',
  //     filter: `grayscale(0.85) ${fallbackVar(vars.safariAnimationHook, 'blur(1px)')}`,
  //     willChange: 'opacity, filter'
  //   }
  // }
})

export const edgeLabelText = style({
  textAlign: 'center',
  whiteSpaceCollapse: 'preserve-breaks',
  fontSize: mantine.fontSizes.sm,
  lineHeight: mantine.lineHeights.xs
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
