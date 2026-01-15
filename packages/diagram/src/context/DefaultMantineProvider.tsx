import { type MantineProviderProps, createTheme, MantineProvider, Portal, Tooltip } from '@mantine/core'

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
  components: {
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
