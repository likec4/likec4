import { createTheme, type MantineThemeOverride, mergeMantineTheme } from '@mantine/core'
import { useColorScheme as usePreferredColorScheme } from '@mantine/hooks'
import { useIsomorphicLayoutEffect } from '@react-hookz/web'
import { useEffect, useState } from 'react'
import { isString } from 'remeda'
import fontCss from './font.css?inline'
import { shadowRoot } from './styles.css'

declare const __likec4styles: Map<string, string>
declare const __USE_STYLE_BUNDLE__: boolean
declare const SHADOW_STYLE: string

export const DefaultTheme = createTheme({
  autoContrast: true,
  primaryColor: 'indigo',
  cursorType: 'pointer',
  defaultRadius: 'sm',
  fontFamily: 'var(--likec4-default-font-family)',
  headings: {
    fontWeight: '500',
    sizes: {
      h1: {
        // fontSize: '2rem',
        fontWeight: '600'
      },
      h2: {
        fontWeight: '500'
        // fontSize: '1.85rem',
      }
    }
  }
}) as MantineThemeOverride

// Also used by MantineProvider as cssVariablesSelector
export const ShadowRootCssSelector = `.${shadowRoot}`

export const BundledStyles = () => {
  let styles
  if (__USE_STYLE_BUNDLE__) {
    styles = SHADOW_STYLE
  } else {
    styles = [
      ...Array.from(__likec4styles.values()),
      // vanilla-extract in transform mode
      ...Array.from(document.querySelectorAll(`style[data-package="likec4"][data-file$=".css.ts"]`)).map((style) => {
        return style.textContent
      })
    ].filter(isString).join('\n')
  }
  // return BundledStyles
  return styles.replaceAll('body {', `${ShadowRootCssSelector}{`)
    .replaceAll('body{', `${ShadowRootCssSelector}{`)
    .replaceAll(':root', `${ShadowRootCssSelector}`)
}

const createStyleSheet = () => {
  const bundledCSS = new CSSStyleSheet()
  bundledCSS.replaceSync(BundledStyles())
  return bundledCSS
}

export function useCreateStyleSheet(injectFontCss: boolean) {
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

export function useBundledStyleSheet(injectFontCss = true) {
  const [styleSheets, setStyleSheets] = useState([] as CSSStyleSheet[])
  const createCssStyleSheet = useCreateStyleSheet(injectFontCss)

  useIsomorphicLayoutEffect(() => {
    const css = createCssStyleSheet()
    setStyleSheets([css])
    return () => {
      css.replaceSync('')
    }
  }, [createCssStyleSheet])

  return styleSheets
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
export function useColorScheme(explicit?: ColorScheme): ColorScheme {
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
