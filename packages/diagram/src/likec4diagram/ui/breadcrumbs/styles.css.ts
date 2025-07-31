import { cva } from '@likec4/styles/css'

export const breadcrumbTitle = cva({
  base: {
    fontSize: 'sm',
    fontWeight: '500',
    transition: 'fast',
    width: 'max-content',
    color: {
      base: 'mantine.colors.text/90',
      _hover: 'mantine.colors.text',
    },
  },
  variants: {
    truncate: {
      'true': {
        truncate: true,
        maxWidth: '200px',
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
