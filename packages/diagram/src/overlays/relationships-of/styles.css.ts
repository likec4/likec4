import { createVar, globalStyle, style } from '@vanilla-extract/css'
import { vars, xyvars } from '../../theme-vars'

const mixColor = createVar('mix-color')
//
export const overlay = style({
  // position: 'absolute',
  // top: 20,
  // left: 20,
  // width: 'calc(100% - 40px)',
  // height: 'calc(100% - 40px)',
  // overflow: 'hidden',
  vars: {
    [mixColor]: `black`,
    [xyvars.edge.stroke]: vars.relation.lineColor,
    [xyvars.edge.strokeSelected]: `color-mix(in srgb, ${vars.relation.lineColor}, ${mixColor} 35%)`,
    [xyvars.edge.labelColor]: `color-mix(in srgb, ${vars.relation.labelColor}, rgba(255 255 255 / 0.85) 50%)`,
    [xyvars.edge.labelBgColor]: `color-mix(in srgb, ${vars.relation.labelBgColor}, transparent 30%)`
  }
})

globalStyle(`:where([data-mantine-color-scheme="dark"]) ${overlay}`, {
  vars: {
    [mixColor]: `white`,
    [xyvars.edge.labelColor]: vars.relation.labelColor,
    [xyvars.edge.labelBgColor]: `color-mix(in srgb, ${vars.relation.labelBgColor}, transparent 50%)`
  }
})

globalStyle(`:where(${overlay}) .react-flow__attribution`, {
  display: 'none'
})
globalStyle(`:where(${overlay}) .react-flow__edge-text`, {
  fontSize: 14
})
