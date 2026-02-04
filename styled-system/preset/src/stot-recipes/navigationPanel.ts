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
      margin: '0',
      width: '100%',
      gap: 'xxs',
      height: 'auto',
      overflow: 'hidden',
      maxHeight: [
        'calc(100vh)',
        'calc(100cqh)',
      ],
      maxWidth: [
        'calc(100vw)',
        'calc(100cqw)',
      ],
      '@/sm': {
        margin: 'xs',
        gap: 'xs',
        width: 'max-content',
        maxWidth: [
          'calc(100vw - 2 * {spacing.xs})',
          'calc(100cqw - 2 * {spacing.xs})',
        ],
        maxHeight: [
          'calc(100vh - 2 * {spacing.xs})',
          'calc(100cqh - 2 * {spacing.xs})',
        ],
      },
      '@/md': {
        margin: 'sm',
        width: 'max-content',
        maxWidth: [
          'calc(100vw - 2 * {spacing.md})',
          'calc(100cqw - 2 * {spacing.md})',
        ],
        maxHeight: [
          'calc(100vh - 2 * {spacing.md})',
          'calc(100cqh - 2 * {spacing.md})',
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
      '@/sm': {
        width: 'auto',
      },
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
      width: {
        base: '20px',
        '@/sm': '64px',
      },

      ['& > [data-logo-icon]']: {
        display: {
          base: 'block',
          '@/sm': 'none',
        },
      },
      ['& > [data-logo-full]']: {
        display: {
          base: 'none',
          '@/sm': 'block',
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
    dropdown: {
      display: 'flex',
      height: 'auto',
      width: 'auto',
      flex: '1',
      flexGrow: 0,
      overflow: 'hidden',
      layerStyle: 'likec4.dropdown',
      pointerEvents: 'all',
    },
  },
  variants: {
    size: {
      md: {},
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
        label: {
          '@/sm': {
            fontSize: 'md',
          },
        },
      },
    },
    panelPosition: {
      left: {
        root: {
          top: '0',
          left: '0',
        },
      },
      right: {
        root: {
          top: '0',
          right: '0',
        },
      },
    },
  },
  defaultVariants: {
    size: 'md',
    panelPosition: 'left',
  },
  staticCss: [{
    size: ['*'],
    panelPosition: ['*'],
  }],
})
