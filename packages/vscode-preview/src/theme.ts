import { createTheme, type MantineTheme } from '@mantine/core'

export const theme = createTheme({
  primaryColor: 'indigo',
  fontFamily: 'var(--likec4-font-family)',
  headings: {
    fontWeight: '500',
    sizes: {
      h1: {
        // fontSize: '2rem',
        fontWeight: '600'
      },
      h2: {
        // fontSize: '1.85rem',
      }
    }
  }
}) as MantineTheme
