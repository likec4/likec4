import { createTheme } from '@mantine/core'
import { isString } from 'remeda'
import fontCss from './font.css?inline'

export const bundledStyles = () => {
  let BundledStyles
  if (__USE_SHADOW_STYLE__) {
    BundledStyles = SHADOW_STYLE
  } else {
    BundledStyles = Array.from(__likec4styles.values()).filter(isString).join('\n')
  }
  // return BundledStyles
  return BundledStyles.replaceAll('body {', '.likec4-react-root{')
    .replaceAll('body{', '.likec4-react-root{')
    .replaceAll(':root', '.likec4-shadow-root')
}

export const theme = createTheme({
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
})

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
    if (window.matchMedia('(color-scheme: light)').matches) {
      return 'light'
    }
    if (window.matchMedia('(color-scheme: dark)').matches) {
      return 'dark'
    }
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light'
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
  } catch (_e) {
    // noop
  }
  return undefined
}

// export const IbmPlexSans = ``
// const fonthref = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap'
// export const IbmPlexSans = `<link href="${fonthref}" rel="stylesheet">`
export const IbmPlexSans = `<style>
${fontCss}
</style>`

// const key = '__likec4_fontcheck';
// (window as any)[key] ??= setTimeout(() => {
//   (window as any)[key] = undefined
//   // if (document.fonts.check(`16px 'IBM Plex Sans'`)) {
//   //   return
//   // }
if (!document.querySelector(`style[data-likec4-font]`)) {
  const style = document.createElement('style')
  style.setAttribute('type', 'text/css')
  style.setAttribute('data-likec4-font', '')
  style.appendChild(document.createTextNode(fontCss))
  document.head.appendChild(style)
}
// }, 100)
