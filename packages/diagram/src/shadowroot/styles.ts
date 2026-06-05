// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import {
  useColorScheme as usePreferredColorScheme,
  useMutationObserverTarget,
} from '@mantine/hooks'
import { useState } from 'react'
import { first, isFunction, isString, once } from 'remeda'
import { useCallbackRef } from '../hooks/useCallbackRef'
import fontsCss from '../styles-font.css?inline'
import inlinedStyles from '../styles.css?inline'

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

export function appendFontToDocument(injectFontCss: boolean, styleNonce?: string | (() => string) | undefined) {
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
}

/**
 * Creates a CSS string with styles scoped to the shadow root
 * @returns CSS string for the shadow root
 */
export const shadowRootCSS = once(() => {
  return scopeStylesToShadowRoot(inlinedStyles)
})
/**
 * Creates a CSSStyleSheet with styles scoped to the shadow root
 */
export function createShadowRootStylesheets(csstext: string) {
  const css = new CSSStyleSheet()
  css.replaceSync(csstext)
  return [css] as [CSSStyleSheet]
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
