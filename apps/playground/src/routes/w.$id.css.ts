import { style } from '@vanilla-extract/css'
import { mantine } from '../mantine.css'

export const resize = style({
  cursor: 'ew-resize',
  userSelect: 'none',
  width: 8,
  height: '100%',
  borderRadius: 4,
  backgroundColor: mantine.colors.body,
  transition: 'background-color 120ms ease-out',

  ':hover': {
    backgroundColor: mantine.colors.defaultHover
  }
})
