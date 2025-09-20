import type { RefObject } from 'react'
import { createContext, useContext } from 'react'

export const RootContainerContext = createContext<{ id: string; ref: RefObject<HTMLDivElement | null> } | null>(null)

export function useRootContainer() {
  const ctx = useContext(RootContainerContext)
  if (!ctx) {
    throw new Error('useRootContainer must be used within a RootContainer')
  }
  return ctx
}

export function useRootContainerRef() {
  return useRootContainer().ref
}

export function useRootContainerElement() {
  return useRootContainer().ref.current
}
