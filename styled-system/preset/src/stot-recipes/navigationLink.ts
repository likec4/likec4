import { defineSlotRecipe } from '@pandacss/dev'

export const navigationLink = defineSlotRecipe({
  className: 'likec4-navlink',
  description: 'Navigation Link (classes for Mantine NavLink)',
  jsx: ['NavLink'],
  slots: ['root', 'body', 'section', 'label', 'description'],
  base: {
    root: {
      rounded: 'sm',
      px: 'xs',
      py: 'xxs',
      backgroundColor: {
        _hover: {
          '&:not([data-active])': {
            base: 'mantine.colors.gray[1]',
            _dark: 'mantine.colors.dark[5]',
          },
        },
      },
    },
    body: {
      gap: '0.5',
      display: 'flex',
      flexDirection: 'column',
    },
    section: {
      '&:where([data-position="left"])': {
        marginInlineEnd: 'xxs',
        // alignSelf: 'flex-start',
      },
    },
    label: {
      display: 'block',
      fontSize: 'sm',
      fontWeight: '500',
      lineHeight: 1.2,
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
    truncateLabel: ['*'],
    conditions: ['*'],
  }],
})
