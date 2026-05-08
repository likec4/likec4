import { useStore } from '@nanostores/react'
import type { WritableAtom } from 'nanostores'
import type { RefObject } from 'react'
import { createContext, useContext } from 'react'

export type RootContainerContextType = {
  readonly id: string
  readonly selector: string
  readonly ref: RefObject<HTMLDivElement | null>
  readonly $panning: WritableAtom<boolean>
  readonly reducedGraphics: boolean
}

const RootContainerContext = createContext<RootContainerContextType | null>(null)
export const RootContainerContextProvider = RootContainerContext.Provider

export function useRootContainerContext() {
  return useContext(RootContainerContext)
}

export function useRootContainer() {
  const ctx = useRootContainerContext()
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

/**
 * Hook to determine if reduced graphics mode is enabled.
 */
export function useIsReducedGraphics() {
  return useRootContainerContext()?.reducedGraphics ?? false
}

export function useIsPanning() {
  return useStore(useRootContainer().$panning)
}
