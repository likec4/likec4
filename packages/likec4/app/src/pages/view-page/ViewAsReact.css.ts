import { globalStyle, style } from '@vanilla-extract/css'

export const reactDiagram = style({
  'vars': {
    '--diagram-bg-size': '24px',
    '--diagram-bg-position-x': '0px',
    '--diagram-bg-position-y': '0px'
  }
})

globalStyle(`${reactDiagram} .konvajs-content::before`, {
  content: ' ',
  position: 'absolute',
  padding: 0,
  margin: 0,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  touchAction: 'none',
  userSelect: 'none',
  backgroundOrigin: 'border-box',
  backgroundAttachment: 'fixed',
  backgroundImage: 'radial-gradient(var(--gray-a3) 12%, transparent 12%)',
  backgroundPosition: 'var(--diagram-bg-position-x) var(--diagram-bg-position-y)',
  backgroundSize: 'var(--diagram-bg-size) var(--diagram-bg-size)',
  zIndex: -1
})
