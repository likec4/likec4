import { createTheme, type MantineTheme } from '@mantine/core'
import { isString } from 'remeda'
import fontCss from '../react/components/font.css?inline'

export const bundledStyles = () => {
  let BundledStyles
  if (__USE_STYLE_BUNDLE__) {
    BundledStyles = SHADOW_STYLE
  } else {
    BundledStyles = [
      ...Array.from(__likec4styles.values()),
      // vanilla-extract in transform mode
      ...Array.from(document.querySelectorAll(`style[data-package="likec4"][data-file$=".css.ts"]`)).map((style) => {
        return style.textContent
      })
    ].filter(isString).join('\n')
  }
  ensureFontCss()
  // return BundledStyles
  return BundledStyles.replaceAll('body {', '.likec4-react-root{')
    .replaceAll('body{', '.likec4-react-root{')
    .replaceAll(':root', '.likec4-shadow-root')
}

export const theme = createTheme({
  autoContrast: true,
  primaryColor: 'indigo',
  cursorType: 'pointer',
  defaultRadius: 'sm',
  fontFamily: 'var(--font-family)',
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

const getComputedColorScheme = (el: Element) => {
  try {
    const colorScheme = window.getComputedStyle(el).colorScheme
    if (colorScheme === 'light' || colorScheme === 'dark') {
      return colorScheme
    }
  } catch (_e) {
    // noop
  }
  return undefined
}

export const matchesColorScheme = (el: Element) => {
  try {
    const colorScheme = getComputedColorScheme(el) ?? getComputedColorScheme(document.body)
    if (colorScheme) {
      return colorScheme
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  } catch (_e) {
    // noop
  }
  return undefined
}

function ensureFontCss() {
  if (!document.querySelector(`style[data-likec4-font]`)) {
    const style = document.createElement('style')
    style.setAttribute('type', 'text/css')
    style.setAttribute('data-likec4-font', '')
    style.appendChild(document.createTextNode(fontCss))
    document.head.appendChild(style)
  }
}
