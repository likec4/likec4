import { createTheme } from '@mantine/core'

export const theme = createTheme({
  primaryColor: 'indigo',
  cursorType: 'pointer',
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
})
