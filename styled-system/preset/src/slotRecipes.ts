import { defineSlotRecipe } from '@pandacss/dev'

export const navBtn = defineSlotRecipe({
  className: 'likec4-navbtn',
  description: 'Navigation Button (based on Mantine NavLink)',
  jsx: ['NavBtn'],
  slots: ['root', 'body', 'section', 'label', 'description'],
  base: {
    root: {
      rounded: 'sm',
      px: 'xs',
      py: '2xs',
      _dark: {
        _hover: {
          '&:not([data-active])': {
            backgroundColor: 'mantine.colors.dark[5]',
          },
        },
      },
    },
    body: {
      gap: 2,
      display: 'flex',
      flexDirection: 'column',
    },
    section: {
      '&:where([data-position="left"])': {
        marginInlineEnd: '2xs',
        // alignSelf: 'flex-start',
      },
    },
    label: {
      display: 'block',
      fontSize: 'sm',
      fontWeight: '500',
      lineHeight: 1.1,
    },
    description: {
      display: 'block',
      fontSize: 'xxs',
      lineHeight: 1.2,
    },
  },
  variants: {
    truncateLabel: {
      'true': {
        label: {
          width: '100%',
          truncate: true,
        },
        description: {
          width: '100%',
          truncate: true,
        },
      },
      'false': {},
    },
  },
  defaultVariants: {
    truncateLabel: false,
  },
  staticCss: [{
    truncateLabel: ['true', 'false'],
    conditions: ['hover'],
  }, {
    truncateLabel: ['true', 'false'],
    conditions: ['hover'],
  }],
})
