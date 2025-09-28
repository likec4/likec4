import { createSafeContext } from '@mantine/core'
import { useStore } from '@nanostores/react'
import type { WritableAtom } from 'nanostores'
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

export const ReduceGraphicsModeCtx = createContext<boolean | null>(null)
/**
 * Hook to determine if reduced graphics mode is enabled.
 */
export function useIsReducedGraphics() {
  const isReduced = useContext(ReduceGraphicsModeCtx)
  if (isReduced === null) {
    console.warn('ReduceGraphicsMode is not provided')
  }
  return isReduced ?? false
}

export const [PanningAtomSafeCtx, usePanningAtom] = createSafeContext<WritableAtom<boolean>>(
  'PanningAtomSafeCtx is not provided',
)

export function useIsPanning() {
  return useStore(usePanningAtom())
}
