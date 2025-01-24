import { rem } from '@mantine/core'
import { globalStyle, style } from '@vanilla-extract/css'
import { mantine, transitions, vars, whereDark, xyvars } from '../../../theme-vars'

export const emptyNode = style({
  width: '100%',
  height: '100%',
  border: `3px dashed ${mantine.colors.defaultBorder}`,
  borderRadius: mantine.radius.md,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
})
