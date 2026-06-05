import { createContext, useContext } from 'react'

export const ShadowRootContext = createContext<ShadowRoot | null>(null)

export function useShadowRoot(): ShadowRoot {
  const context = useContext(ShadowRootContext)
  if (!context) {
    throw new Error('useShadowRoot must be used within a ShadowRoot')
  }
  return context
}
