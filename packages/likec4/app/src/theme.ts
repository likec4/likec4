import { type MantineTheme, createTheme, Portal, SegmentedControl, Tooltip } from '@mantine/core'

export const theme = createTheme({
  autoContrast: true,
  primaryColor: 'indigo',
  cursorType: 'pointer',
  fontFamily: 'var(--likec4-app-font)',
  headings: {
    fontWeight: '500',
    sizes: {
      h1: {
        // fontSize: '2rem',
        fontWeight: '600',
      },
      h2: {
        // fontSize: '1.85rem',
      },
    },
  },
  fontSizes: {
    xxs: 'var(--font-sizes-xxs)',
    xs: 'var(--font-sizes-xs)',
    sm: 'var(--font-sizes-sm)',
    md: 'var(--font-sizes-md)',
    lg: 'var(--font-sizes-lg)',
    xl: 'var(--font-sizes-xl)',
  },
  spacing: {
    xs: 'var(--spacing-xs)',
    sm: 'var(--spacing-sm)',
    md: 'var(--spacing-md)',
    lg: 'var(--spacing-lg)',
    xl: 'var(--spacing-xl)',
  },
  components: {
    SegmentedControl: SegmentedControl.extend({
      vars: (theme, props, ctx) => ({
        root: {
          '--sc-font-size': theme.fontSizes[props.fz ?? props.size],
        },
      }),
    }),
    Portal: Portal.extend({
      defaultProps: {
        reuseTargetNode: true,
      },
    }),
    Tooltip: Tooltip.extend({
      defaultProps: {
        color: 'dark',
      },
    }),
  },
}) as MantineTheme
