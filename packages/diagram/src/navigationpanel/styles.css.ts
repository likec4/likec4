import { cva } from '@likec4/styles/css'

export const breadcrumbTitle = cva({
  base: {
    fontSize: 'sm',
    fontWeight: '500',
    transition: 'fast',
    color: {
      base: 'likec4.panel.action',
      _hover: 'likec4.panel.action.hover',
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
          base: 'likec4.panel.text.dimmed',
          _hover: 'likec4.panel.action',
        },
      },
    },
  },
})
