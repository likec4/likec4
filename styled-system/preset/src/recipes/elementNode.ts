import { defineRecipe } from '@pandacss/dev'

export const elementNode = defineRecipe({
  className: 'likec4-element-node',
  jsx: ['ElementNodeContainer', 'ElementNode'],
  base: {
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
        top: 'calc(100% - 4px)',
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

    [`&:is([data-likec4-shape="document"])`]: {
      paddingBottom: '16px',
    },
  },
  staticCss: [{
    conditions: ['*'],
  }],
})
