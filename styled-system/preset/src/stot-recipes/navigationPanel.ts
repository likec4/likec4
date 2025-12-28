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
      '@/sm': {
        margin: 'xs',
        gap: 'xs',
        width: 'max-content',
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
        body: {
          minHeight: '40px',
        },
        logo: {
          width: {
            base: '[20px]',
            '@/md': '[64px]',
          },
        },
      },

      lg: {
        body: {
          '@/sm': {
            gap: 'sm',
            minHeight: '48px',
            paddingInline: 'md',
            _hover: {
              boxShadow: 'xl',
            },
          },
        },
        logo: {
          '@/sm': {
            width: '[74px]',
          },
        },
        label: {
          '@/sm': {
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
