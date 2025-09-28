import { css } from '@likec4/styles/css'
import { type MantineThemeOverride, createTheme, Portal } from '@mantine/core'
import {
  useColorScheme as usePreferredColorScheme,
  useDebouncedCallback,
  useMutationObserver,
} from '@mantine/hooks'
import { useIsomorphicLayoutEffect } from '@react-hookz/web'
import { useState } from 'react'
import { first, isFunction, isString } from 'remeda'
import fontsCss from '../styles-font.css?inline'
import inlinedStyles from '../styles.css?inline'

export const DefaultTheme = createTheme({
  autoContrast: true,
  primaryColor: 'indigo',
  cursorType: 'pointer',
  defaultRadius: 'sm',
  fontFamily: 'var(--likec4-app-font, var(--likec4-app-font-default))',
  headings: {
    fontWeight: '500',
    sizes: {
      h1: {
        // fontSize: '2rem',
        fontWeight: '600',
      },
      h2: {
        fontWeight: '500',
        // fontSize: '1.85rem',
      },
    },
  },
  components: {
    Portal: Portal.extend({
      defaultProps: {
        reuseTargetNode: true,
      },
    }),
  },
}) as MantineThemeOverride

export const cssInteractive = css({
  cursor: 'pointer',
  ['--mantine-cursor-pointer']: 'pointer',
  '& :where(.likec4-diagram, .likec4-compound-node, .likec4-element-node)': {
    cursor: 'pointer',
  },
})

export function useBundledStyleSheet(injectFontCss: boolean, styleNonce?: string | (() => string) | undefined) {
  const [styleSheets, setStyleSheets] = useState([] as CSSStyleSheet[])

  useIsomorphicLayoutEffect(() => {
    if (injectFontCss && !document.querySelector(`style[data-likec4-font]`)) {
      const style = document.createElement('style')
      style.setAttribute('type', 'text/css')
      style.setAttribute('data-likec4-font', '')
      if (isString(styleNonce)) {
        style.setAttribute('nonce', styleNonce)
      }
      if (isFunction(styleNonce)) {
        style.setAttribute('nonce', styleNonce())
      }
      style.appendChild(document.createTextNode(fontsCss))
      document.head.appendChild(style)
    }
  }, [injectFontCss])

  useIsomorphicLayoutEffect(() => {
    const css = new CSSStyleSheet()
    css.replaceSync(
      inlinedStyles
        .replaceAll(':where(:root,:host)', `.likec4-shadow-root`)
        .replaceAll(':root', `.likec4-shadow-root`)
        .replaceAll('body {', `.likec4-shadow-root{`)
        .replaceAll('body{', `.likec4-shadow-root{`),
    )
    setStyleSheets([css])
    return () => {
      css.replaceSync('')
    }
  }, [inlinedStyles])

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
  useMutationObserver(
    useDebouncedCallback(() => setComputed(getComputedColorScheme), 100),
    {
      attributes: true,
      childList: false,
      subtree: false,
    },
    () => document.documentElement,
  )

  return explicit ?? computed ?? preferred
}

export function useShadowRootStyle(
  instanceId: string,
  keepAspectRatio: false | { width: number; height: number } = false,
): string {
  if (keepAspectRatio === false) {
    return `
:where([data-likec4-instance="${instanceId}"]) {
  display: block;
  box-sizing: border-box;
  border: 0 solid transparent;
  background: transparent;
  padding: 0;
  margin: 0;
  overflow: hidden;
  width: 100%;
  height: 100%;
  min-width: 80px;
  min-height: 80px;
}
  `.trim()
  }

  const { width, height } = keepAspectRatio
  const isLandscape = width > height

  return `
:where([data-likec4-instance="${instanceId}"]) {
  display: block;
  box-sizing: border-box;
  border: 0 solid transparent;
  background: transparent;
  padding: 0;
  overflow: hidden;
  aspect-ratio: ${Math.ceil(width)} / ${Math.ceil(height)};
  ${
    isLandscape ? '' : `
  max-width: min(100%, var(--likec4-view-max-width, ${Math.ceil(width)}px));
  margin-left: auto;
  margin-right: auto;`
  }
  width: ${isLandscape ? '100%' : 'auto'};
  height: ${isLandscape ? 'auto' : '100%'};
  ${isLandscape ? `min-width: 80px;` : `min-height: 80px;`}
  max-height: min(100%, var(--likec4-view-max-height, ${Math.ceil(height)}px));
}
`.trim()
}
