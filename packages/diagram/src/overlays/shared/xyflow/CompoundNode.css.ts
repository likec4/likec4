import { style } from "@vanilla-extract/css"
import { vars } from "../../../theme-vars"

export const compoundNodeBody = style({
  position: 'relative',
  width: '100%',
  height: '100%',
  boxShadow: '0 4px 10px 0.5px rgba(0,0,0,0.1) , 1px 1px 4px -1px rgba(0,0,0,0.3)',
  background: `color-mix(in srgb , ${vars.element.fill},  transparent 10%)`,
  borderRadius: 6
})

export const compoundNodeTitle = style({
  fontFamily: vars.compound.font,
  fontWeight: 600,
  fontSize: 15,
  lineHeight: 1,
  textTransform: 'uppercase',
  paddingTop: 14,
  paddingLeft: 12,
  mixBlendMode: 'screen',
  color: vars.compound.titleColor
})
