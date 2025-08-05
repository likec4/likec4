import { defineRecipe } from '@pandacss/dev'
import { iconSize } from '../const'

const varIconSize = `var(${iconSize})`
export const elementNodeIcon = defineRecipe({
  className: 'likec4-element-node-icon',
  description: 'Element Icon displayed in diagram nodes',
  base: {
    flex: `0 0 ${varIconSize}`,
    height: varIconSize,
    width: varIconSize,
    display: 'flex',
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    mixBlendMode: {
      base: 'hard-light',
      _reduceGraphicsOnPan: 'normal',
    },
    '& svg, & img': {
      width: '100%',
      height: 'auto',
      maxHeight: '100%',
      pointerEvents: 'none',
      filter: {
        base: [
          'drop-shadow(0 0 3px rgb(0 0 0 / 12%))',
          'drop-shadow(0 1px 8px rgb(0 0 0 / 8%))',
          'drop-shadow(1px 1px 16px rgb(0 0 0 / 3%))',
        ],
        _reduceGraphicsOnPan: 'none',
      },
    },
    '& img': {
      objectFit: 'contain',
    },
  },
  staticCss: [{
    conditions: ['*'],
  }],
})
