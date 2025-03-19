import type { DiagramView } from '@likec4/core'
import { css, cx } from '@likec4/styles/css'
import { type MantineThemeOverride, createTheme, Portal } from '@mantine/core'
import { useColorScheme as usePreferredColorScheme, useDebouncedCallback, useMutationObserver } from '@mantine/hooks'
import { useIsomorphicLayoutEffect } from '@react-hookz/web'
import { useId, useState } from 'react'
import { first, isFunction, isString } from 'remeda'
import inlinedCss from '../styles.css?inline'
import fontsCss from './font.css?inline'

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

// Also used by MantineProvider as cssVariablesSelector
const shadowRoot = 'likec4-shadow-root'
export const ShadowRootCssSelector = `.${shadowRoot}`
const BundlesCss = inlinedCss
  .replaceAll('body {', `${ShadowRootCssSelector}{`)
  .replaceAll('body{', `${ShadowRootCssSelector}{`)
  .replaceAll(':root', `${ShadowRootCssSelector}`)

export const root = cx(
  shadowRoot,
  css({
    margin: 0,
    padding: 0,
    display: 'block',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    position: 'relative',
  }),
)

export const cssInteractive = css({
  cursor: 'pointer',
  ['--mantine-cursor-pointer']: 'pointer',
  '& :where(.likec4-diagram, .likec4-compound-node, .likec4-element-node)': {
    cursor: 'pointer',
  },
})

export const browserOverlay = css({
  inset: '2rem',
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
    css.replaceSync(BundlesCss)
    setStyleSheets([css])
    return () => {
      css.replaceSync('')
    }
  }, [BundlesCss])

  return styleSheets
}

const getComputedColorScheme = (): ColorScheme | null => {
  try {
    const htmlScheme = window.getComputedStyle(document.documentElement).colorScheme ?? ''
    const colorScheme = first(htmlScheme.split(' '))
    if (colorScheme === 'light' || colorScheme === 'dark') {
      return colorScheme
    }
  } catch (_e) {
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
  keepAspectRatio: boolean,
  view: DiagramView,
): [{ 'data-likec4-instance': string }, style: string] {
  const id = useId()

  if (keepAspectRatio === false) {
    return [
      { 'data-likec4-instance': id },
      `
:where([data-likec4-instance="${id}"]) {
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
  `.trim(),
    ]
  }

  const isLandscape = view.bounds.width > view.bounds.height

  return [
    { 'data-likec4-instance': id },
    `
:where([data-likec4-instance="${id}"]) {
  display: block;
  box-sizing: border-box;
  border: 0 solid transparent;
  background: transparent;
  padding: 0;
  overflow: hidden;
  ${
      isLandscape ? '' : `
  max-width: var(--likec4-view-max-width, ${Math.ceil(view.bounds.width)}px);
  margin-left: auto;
  margin-right: auto;`
    }
  width: ${isLandscape ? '100%' : 'auto'};
  height: ${isLandscape ? 'auto' : '100%'};
  ${isLandscape ? `min-width: 80px;` : `min-height: 80px;`}
  aspect-ratio: ${Math.ceil(view.bounds.width)} / ${Math.ceil(view.bounds.height)};
  max-height: var(--likec4-view-max-height, ${Math.ceil(view.bounds.height)}px);
}
`.trim(),
  ]
}
