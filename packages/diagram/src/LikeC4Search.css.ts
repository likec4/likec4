import { rem } from '@mantine/core'
import { globalStyle, style } from '@vanilla-extract/css'

export const actionSection = style({
  marginInlineEnd: 4
})

globalStyle(`:where(${actionSection}) .tabler-icon`, {
  opacity: 0.8,
  width: '70%',
  height: '70%'
})
