// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

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

export function scopeStylesToShadowRoot(styles: string): string {
  return styles
    // Order matters: rewrite the longest root selector before the plain `:root` token.
    .replaceAll(/:where\(\s*:root\s*,\s*:host\s*\)/g, `:where(.likec4-shadow-root)`)
    .replaceAll(':root', `.likec4-shadow-root`)
    /**
     * Replace only top-level body selectors, for example
     * `body { }` should be replaced with `.likec4-shadow-root { }`
     * but `.likec4-overlay-body { }` must stay unchanged.
     */
    .replaceAll(/(^|[{},;]|\*\/)(\s*)body(?=\s*[{,])/g, '$1$2.likec4-shadow-root')
}

export function useBundledStyleSheet(injectFontCss: boolean, styleNonce?: string | (() => string) | undefined) {
  const [styleSheets] = useState(() => {
    const css = new CSSStyleSheet()
    css.replaceSync(scopeStylesToShadowRoot(inlinedStyles))
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

const getDocumentElement = () => document.documentElement
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
    getDocumentElement,
  )

  return explicit ?? computed ?? preferred
}
