import { defineRecipe } from '@pandacss/dev'
import { mantine } from '../generated'
import { alpha } from '../helpers'

export const idBadge = defineRecipe({
  className: 'id-badge',
  description: 'Renders an ID badge (FQN / View ID)',
  jsx: ['IdBadge'],
  base: {
    pointerEvents: 'all',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    width: 'min-content',
    transition: 'fast',
    cursor: 'default',
    fontFamily: 'likec4',
    fontSize: 'xxs',
    lineHeight: 'xs',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    color: {
      base: 'text.dimmed',
      _hover: 'text',
    },

    padding: '[2px 5px]',
    borderRadius: 'sm',

    background: {
      base: alpha(mantine.colors.gray[3], 20),
      _dark: mantine.colors.dark[9],
    },
  },
  staticCss: ['*'],
})
