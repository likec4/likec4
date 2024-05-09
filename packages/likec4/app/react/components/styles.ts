import { createTheme, type MantineTheme } from '@mantine/core'
import { useColorScheme as useColorSchemeMedia } from '@mantine/hooks'
import { useIsomorphicLayoutEffect } from '@react-hookz/web'
import { useCallback } from 'react'
import { isString } from 'remeda'
import fontCss from '../../webcomponent/font.css?inline'
import { cssRoot } from './styles.css'

const rootSelector = `.${cssRoot}`

const bundledStyles = () => {
  let BundledStyles
  if (__USE_SHADOW_STYLE__) {
    BundledStyles = SHADOW_STYLE
  } else {
    BundledStyles = Array.from(__likec4styles.values()).filter(isString).join('\n')
  }
  // return BundledStyles
  return BundledStyles.replaceAll('body {', `${rootSelector}{`)
    .replaceAll('body{', `${rootSelector}{`)
    .replaceAll(':root', `${rootSelector}`)
}

export const useCreateCssStyleSheet = () => {
  useIsomorphicLayoutEffect(() => {
    if (!document.querySelector(`style[data-likec4-font]`)) {
      const style = document.createElement('style')
      style.setAttribute('type', 'text/css')
      style.setAttribute('data-likec4-font', '')
      style.appendChild(document.createTextNode(fontCss))
      document.head.appendChild(style)
    }
  }, [])

  return useCallback(() => {
    const bundledCSS = new CSSStyleSheet()
    bundledCSS.replaceSync(bundledStyles())
    return bundledCSS
  }, [])
}

export const useColorScheme = (explicit: 'light' | 'dark' | undefined) => {
  const autoColorScheme = useColorSchemeMedia()
  return explicit ?? autoColorScheme
}

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
}) as MantineTheme
