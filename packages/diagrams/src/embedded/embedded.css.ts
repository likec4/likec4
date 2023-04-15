import { style } from '@vanilla-extract/css'

export const cssEmbeddedContainer = style({
  flex: '1 1 100%',
  overflow: 'hidden',
  cursor: 'pointer',
})

export const cssMagnifyingGlass = style({
  position: 'absolute',
  bottom: 10,
  right: 10,
  width: 24,
  height: 24
})
