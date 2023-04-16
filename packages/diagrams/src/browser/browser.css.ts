import { style } from '@vanilla-extract/css'

export const dialogContent = style({
  height: '95vh',
  width: '95vw',
  maxWidth: '95vw',
  maxHeight: '95vh',
  padding: 4,
  display: 'flex',
  backgroundColor: '#252930'
})

export const browserContent = style({
  flex: '1 1 100%',
  overflow: 'hidden'
})
