import { fallbackVar, style } from '@vanilla-extract/css'
import { mantine, vars } from '../theme-vars'

export const panel = style({
  top: fallbackVar(vars.optionsPanel.top, '1rem'),
  right: fallbackVar(vars.optionsPanel.right, '1rem'),
  margin: 0,
  boxShadow: mantine.shadows.xl
})
