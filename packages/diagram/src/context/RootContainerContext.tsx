import { createSafeContext } from '@mantine/core'
import { useStore } from '@nanostores/react'
import type { WritableAtom } from 'nanostores'
import type { RefObject } from 'react'
import { createContext, useContext } from 'react'

const RootContainerContext = createContext<
  {
    id: string
    selector: string
    ref: RefObject<HTMLDivElement | null>
  } | null
>(null)
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

const ReduceGraphicsModeCtx = createContext<boolean | null>(null)
export const ReduceGraphicsModeProvider = ReduceGraphicsModeCtx.Provider

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
