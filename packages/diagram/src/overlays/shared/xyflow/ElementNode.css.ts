import { style } from "@vanilla-extract/css"
import { mantine, vars } from "../../../theme-vars"

export const elementNode = style({
  position: 'relative',
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
  fontSize: 18,
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
  fontSize: mantine.fontSizes.sm,
  lineHeight: 1.25,
  textWrap: 'balance',
  color: vars.element.loContrast
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
