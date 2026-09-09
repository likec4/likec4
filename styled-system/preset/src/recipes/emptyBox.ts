import { defineRecipe } from '@pandacss/dev'

export const emptyBox = defineRecipe({
  className: 'empty-box',
  jsx: ['EmptyBox'],
  base: {
    border: '2px dashed {colors.border.subtle}',
    borderRadius: 'sm',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'text.non-essential/70',
    userSelect: 'none',
    paddingInline: 'md',
    paddingBlock: 'lg',
  },
  variants: {
    fullsize: {
      true: {
        width: '100%',
        height: '100%',
      },
    },
  },
  staticCss: ['*'],
})
