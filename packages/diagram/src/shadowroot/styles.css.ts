import {
  useColorScheme as usePreferredColorScheme,
  useMutationObserverTarget,
} from '@mantine/hooks'
import { useState } from 'react'
import { first } from 'remeda'
import { useCallbackRef } from '../hooks/useCallbackRef'

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
type ColorScheme = 'light' | 'dark'
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
