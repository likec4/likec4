import { createTheme } from '@mantine/core'

// @ts-expect-error replaced by vite-plugin
const BundledStyles: string = SHADOW_STYLE

export const bundledCSSStyleSheet = new CSSStyleSheet()
bundledCSSStyleSheet.replaceSync(
  BundledStyles
    .replaceAll('body{', '.likec4-shadow-root{')
    .replaceAll(':root', '.likec4-shadow-root')
)

export const theme = createTheme({
  primaryColor: 'indigo',
  cursorType: 'pointer',
  defaultRadius: 'sm',
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

export const prefersDark = () => {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch (_e) {
    return false
  }
}

export const IbmPlexSans = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
`
