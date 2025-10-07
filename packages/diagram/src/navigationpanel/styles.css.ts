import { cva } from '@likec4/styles/css'

export const breadcrumbTitle = cva({
  base: {
    fontSize: 'sm',
    fontWeight: '500',
    transition: 'fast',
    color: {
      base: 'mantine.colors.text/90',
      _hover: '[var(--mantine-color-bright)]',
    },
  },
  variants: {
    truncate: {
      'true': {
        truncate: true,
      },
    },
    dimmed: {
      'true': {
        color: {
          base: 'mantine.colors.dimmed',
          _hover: 'mantine.colors.text',
        },
      },
    },
  },
})
