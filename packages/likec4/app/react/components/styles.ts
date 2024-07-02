import { useColorScheme as usePreferredColorScheme } from '@mantine/hooks'
import { useIsomorphicLayoutEffect } from '@react-hookz/web'
import { useEffect, useState } from 'react'
import { isString } from 'remeda'
import fontCss from '../../webcomponent/font.css?inline'
import { shadowRoot } from './styles.css'

// Also used by MantineProvider as cssVariablesSelector
export const ShadowRootCssSelector = `.${shadowRoot}`

declare const __likec4styles: Map<string, string>
declare const __USE_SHADOW_STYLE__: boolean
declare const SHADOW_STYLE: string

const bundledStyles = () => {
  let BundledStyles
  if (__USE_SHADOW_STYLE__) {
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
  // return BundledStyles
  return BundledStyles.replaceAll('body {', `${ShadowRootCssSelector}{`)
    .replaceAll('body{', `${ShadowRootCssSelector}{`)
    .replaceAll(':root', `${ShadowRootCssSelector}`)
}

const createStyleSheet = () => {
  const bundledCSS = new CSSStyleSheet()
  bundledCSS.replaceSync(bundledStyles())
  return bundledCSS
}

export const useCreateStyleSheet = (injectFontCss: boolean) => {
  useIsomorphicLayoutEffect(() => {
    if (injectFontCss && !document.querySelector(`style[data-likec4-font]`)) {
      const style = document.createElement('style')
      style.setAttribute('type', 'text/css')
      style.setAttribute('data-likec4-font', '')
      style.appendChild(document.createTextNode(fontCss))
      document.head.appendChild(style)
    }
  }, [injectFontCss])

  return createStyleSheet
}

const getComputedBodyColorScheme = (): ColorScheme | undefined => {
  try {
    const colorScheme = window.getComputedStyle(document.body).colorScheme
    if (colorScheme === 'light' || colorScheme === 'dark') {
      return colorScheme
    }
  } catch (_e) {
    // noop
  }
  return undefined
}

export type ColorScheme = 'light' | 'dark'
export const useColorScheme = (explicit?: ColorScheme) => {
  const preferred = usePreferredColorScheme(explicit)
  const [current, setCurrent] = useState<ColorScheme>(explicit ?? preferred)

  useEffect(() => {
    if (explicit) {
      return
    }
    const computed = getComputedBodyColorScheme()
    if (!computed) {
      if (current !== preferred) {
        setCurrent(preferred)
      }
      return
    }
    if (computed !== current) {
      setCurrent(computed)
      return
    }
  })

  return explicit ?? current
}
