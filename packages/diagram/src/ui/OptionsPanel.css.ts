import { rem } from '@mantine/core'
import { style } from '@vanilla-extract/css'

export const panel = style({
  position: 'absolute',
  top: 56,
  right: rem(16) // right: mantine.spacing.sm
})
