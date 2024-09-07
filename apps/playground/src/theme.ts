import { createTheme, type MantineTheme } from '@mantine/core'

export const theme = createTheme({
  autoContrast: true,
  primaryColor: 'indigo',
  cursorType: 'pointer',
  fontFamily: 'var(--likec4-app-font)',
  defaultRadius: 'sm',
  respectReducedMotion: true,
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
