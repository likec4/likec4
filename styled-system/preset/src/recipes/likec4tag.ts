import { defineRecipe } from '@pandacss/dev'

export const likec4tag = defineRecipe({
  className: 'likec4-tag',
  base: {
    pointerEvents: 'all',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    width: 'min-content',
    transition: 'fast',
    fontSize: 'xs',
    gap: '1',
    cursor: 'default',
    fontFamily: 'likec4.element',
    fontWeight: 'bold',
    layerStyle: 'likec4.tag',
    whiteSpace: 'nowrap',
    px: '4',
    py: '0',
  },
  variants: {
    autoTextColor: {
      false: {
        '& > span': {
          color: 'likec4.tag.text',
          _first: {
            opacity: 0.65,
          },
        },
      },
      true: {
        '& > span': {
          color: '[transparent]',
          filter: 'invert(1) grayscale(1) brightness(1.3) contrast(1000)',
          background: 'inherit',
          backgroundClip: 'text',
          mixBlendMode: 'plus-lighter',
        },
      },
    },
  },
  defaultVariants: {
    autoTextColor: false,
  },
  staticCss: [{
    autoTextColor: ['true', 'false'],
    conditions: ['hover'],
  }],
})
