import { style } from '@vanilla-extract/css'

export const dimmed = style({
  color: 'var(--color-text-dimmed)'
})

export const header = style({
  background: 'var(--color-surface)'
})

export const previewBg = style({
  position: 'relative',
  overflow: 'hidden',
  padding: '0',
  margin: '0',
  backgroundOrigin: 'padding-box',
  backgroundImage: 'radial-gradient(var(--gray-a5)15%, var(--color-panel-translucent)15%)',
  backgroundPosition: '0 0',
  backgroundSize: '12px 12px',
  ':after': {
    content: '',
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    zIndex: '1'
  },
  vars: {
    '--likec4-background-color': 'transparent'
  }
})
