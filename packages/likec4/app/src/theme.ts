import { type MantineTheme, createTheme, Portal } from '@mantine/core'

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
  components: {
    Portal: Portal.extend({
      defaultProps: {
        reuseTargetNode: true,
      },
    }),
  },
}) as MantineTheme
