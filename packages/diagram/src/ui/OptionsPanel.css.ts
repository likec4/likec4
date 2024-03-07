import { rem } from '@mantine/core'
import { style } from '@vanilla-extract/css'
import { mantine } from '../theme'

export const panel = style({
  position: 'absolute',
  top: '1rem',
  right: '1rem',
  margin: 0,
  boxShadow: mantine.shadows.xl
})
