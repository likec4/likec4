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
    fontWeight: 'medium',
    whiteSpace: 'nowrap',

    padding: '[2px 5px]',
    borderRadius: 'sm',

    background: {
      base: alpha(mantine.colors.gray[3], 20),
      _dark: alpha(mantine.colors.dark[9], 30),
      _hover: {
        base: alpha(mantine.colors.gray[3], 80),
        _dark: alpha(mantine.colors.dark[9], 80),
      },
    },
  },
  staticCss: ['*'],
})
