import {
  type MantineProviderProps,
  createTheme,
  MantineProvider,
  Portal,
  SegmentedControl,
  Tooltip,
} from '@mantine/core'

const DefaultTheme = createTheme({
  autoContrast: true,
  primaryColor: 'indigo',
  cursorType: 'pointer',
  defaultRadius: 'sm',
  fontFamily: 'var(--likec4-app-font, var(--likec4-app-font-default))',
  headings: {
    fontWeight: 'medium',
    sizes: {
      h1: {
        // fontSize: '2rem',
        fontWeight: 'bold',
      },
      h2: {
        fontWeight: 'medium',
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
      vars: (theme, props) => ({
        root: {
          // @ts-expect-error
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
})

export function DefaultMantineProvider({
  children,
  ...props
}: MantineProviderProps) {
  return (
    <MantineProvider defaultColorScheme="auto" theme={DefaultTheme} {...props}>
      {children}
    </MantineProvider>
  )
}
