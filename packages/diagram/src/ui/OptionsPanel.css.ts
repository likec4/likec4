import { style } from '@vanilla-extract/css'
import { mantine } from '../mantine'

export const panel = style({
  // position: 'absolute',
  top: '1rem',
  right: '1rem',
  margin: 0,
  boxShadow: mantine.shadows.xl
})
