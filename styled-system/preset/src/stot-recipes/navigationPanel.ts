import { defineSlotRecipe } from '@pandacss/dev'

export const navigationPanel = defineSlotRecipe({
  className: 'likec4-navigation-panel',
  jsx: ['NavigationPanel', /NavigationPanel/],
  slots: ['root', 'body', 'logo', 'label', 'dropdown'],
  description: 'LikeC4 Navigation panel',
  base: {
    root: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      pointerEvents: 'none',
      position: 'absolute',
      top: '0',
      left: '0',
      margin: '0',
      width: '100%',
      gap: 'xxs',
      maxWidth: [
        'calc(100vw)',
        'calc(100cqw)',
      ],
      '@likec4-root/sm': {
        margin: 'xs',
        gap: 'xs',
        width: 'max-content',
        maxWidth: [
          'calc(100vw - 2 * {spacing.xs})',
          'calc(100cqw - 2 * {spacing.xs})',
        ],
      },
      '@likec4-root/md': {
        margin: 'sm',
        maxWidth: [
          'calc(100vw - 2 * {spacing.md})',
          'calc(100cqw - 2 * {spacing.md})',
        ],
      },
      _print: {
        display: 'none',
      },
    },
    body: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      layerStyle: 'likec4.panel',
      position: 'relative',
      gap: 'xs',
      pointerEvents: 'all',
      width: '100%',
      minHeight: '40px',
      cursor: 'default',
    },
    logo: {
      display: 'flex',
      flexDirection: 'row',
      padding: '0.5',
      margin: '0',
      background: 'none',
      border: 'none',
      cursor: 'pointer',

      ['& > [data-logo-icon]']: {
        display: {
          base: 'block',
          '@likec4-root/sm': 'none',
        },
      },
      ['& > [data-logo-full]']: {
        display: {
          base: 'none',
          '@likec4-root/sm': 'block',
        },
      },
    },
    label: {
      fontSize: 'sm',
      fontWeight: '500',
      transition: 'fast',
      userSelect: 'none',
      color: 'likec4.panel.text',
    },
  },
  variants: {
    size: {
      md: {
        logo: {
          width: {
            base: '20px',
            '@likec4-root/md': '64px',
          },
        },
      },

      lg: {
        body: {
          '@likec4-root/sm': {
            gap: 'sm',
            minHeight: '48px',
            paddingInline: 'md',
            _hover: {
              boxShadow: 'xl',
            },
          },
        },
        logo: {
          width: {
            base: '20px',
            '@likec4-root/sm': '74px',
          },
        },
        label: {
          '@likec4-root/sm': {
            fontSize: 'md',
          },
        },
      },
    },
  },
  defaultVariants: {
    size: 'md',
  },
  staticCss: [{
    conditions: ['*'],
    size: ['*'],
    responsive: true,
  }],
})
