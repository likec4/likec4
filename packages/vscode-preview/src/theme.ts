import { type MantineTheme, createTheme } from '@mantine/core'

export const theme = createTheme({
  autoContrast: true,
  primaryColor: 'indigo',
  defaultRadius: 'sm',
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
}) as MantineTheme
