import { css } from '@likec4/styles/css'
import {
  useColorScheme as usePreferredColorScheme,
  useMutationObserverTarget,
} from '@mantine/hooks'
import { useIsomorphicLayoutEffect } from '@react-hookz/web'
import { useState } from 'react'
import { first, isFunction, isString } from 'remeda'
import { useCallbackRef } from '../hooks'
import fontsCss from '../styles-font.css?inline'
import inlinedStyles from '../styles.css?inline'

export const cssInteractive = css({
  cursor: 'pointer',
  ['--mantine-cursor-pointer']: 'pointer',
  '& :where(.likec4-diagram, .likec4-compound-node, .likec4-element-node)': {
    cursor: 'pointer',
  },
})

export function useBundledStyleSheet(injectFontCss: boolean, styleNonce?: string | (() => string) | undefined) {
  const [styleSheets] = useState(() => {
    const css = new CSSStyleSheet()
    css.replaceSync(
      inlinedStyles,
      // .replaceAll(':where(:root,:host)', `:where(.likec4-shadow-root)`)
      // .replaceAll(':root', `.likec4-shadow-root`)
      /**
       * replace only top-level body selectors, for example
       * `body { }` should be replaced with `.likec4-shadow-root { }`
       * but `.likec4-overlay-body { }` - not
       */
      // .replaceAll(/(?<![-_])\bbody\s*\{/g, `.likec4-shadow-root{`),
    )
    return [css]
  })

  useIsomorphicLayoutEffect(() => {
    // Inject font CSS into document head once
    // DO NOT inject into shadow root to avoid FOUC
    if (injectFontCss && !document.querySelector(`style[data-likec4-font]`)) {
      const style = document.createElement('style')
      style.setAttribute('type', 'text/css')
      style.setAttribute('data-likec4-font', '')

      let nonce: string | undefined
      if (isString(styleNonce)) {
        nonce = styleNonce
      }
      if (isFunction(styleNonce)) {
        nonce = styleNonce()
      }
      if (nonce) {
        style.setAttribute('nonce', nonce)
      }
      style.appendChild(document.createTextNode(fontsCss))
      document.head.appendChild(style)
    }
  }, [injectFontCss])

  return styleSheets
}

const getComputedColorScheme = (): ColorScheme | null => {
  try {
    const htmlScheme = window.getComputedStyle(document.documentElement).colorScheme ?? ''
    const colorScheme = first(htmlScheme.split(' '))
    if (colorScheme === 'light' || colorScheme === 'dark') {
      return colorScheme
    }
  } catch {
    // noop
  }
  return null
}

export type ColorScheme = 'light' | 'dark'
export function useColorScheme(explicit?: ColorScheme): ColorScheme {
  const preferred = usePreferredColorScheme()
  const [computed, setComputed] = useState(getComputedColorScheme)
  useMutationObserverTarget(
    useCallbackRef(() => setComputed(getComputedColorScheme)),
    {
      attributes: true,
      childList: false,
      subtree: false,
    },
    () => document.documentElement,
  )

  return explicit ?? computed ?? preferred
}
