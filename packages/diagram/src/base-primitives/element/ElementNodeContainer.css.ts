import { css as style } from '@likec4/styles/css'

export const container = style({
  position: 'relative',
  width: 'full',
  height: 'full',
  padding: '0',
  margin: '0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',

  _focusVisible: {
    outline: 'none',
  },
  _whenSelectable: {
    pointerEvents: 'all',
    _before: {
      content: '" "',
      position: 'absolute',
      top: '[calc(100% - 4px)]',
      left: '0',
      width: 'full',
      height: '24px',
      background: 'transparent',
      pointerEvents: 'all',
    },
  },
  _reduceGraphicsOnPan: {
    _before: {
      display: 'none',
    },
  },

  [`:where(.react-flow__node.selectable:not(.dragging)) &`]: {
    cursor: 'pointer',
  },
})
