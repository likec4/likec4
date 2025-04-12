import { createOptionalContext, createSafeContext } from '@mantine/core'
import { useStore } from '@nanostores/react'
import { type WritableAtom, atom } from 'nanostores'
import { type PropsWithChildren, useRef } from 'react'

const [ReduceGraphicsModeCtx, useReducedGraphics] = createOptionalContext<boolean>()
/**
 * Hook to determine if reduced graphics mode is enabled.
 */
export function useIsReducedGraphics() {
  const isReduced = useReducedGraphics()
  if (isReduced === null) {
    console.warn('ReduceGraphicsMode is not provided')
  }
  return isReduced ?? false
}

const [PanningAtomSafeCtx, usePanningAtom] = createSafeContext<WritableAtom<boolean>>(
  'PanningAtomSafeCtx is not provided',
)

export {
  usePanningAtom,
}

export function ReduceGraphicsContext({ reduceGraphics, children }: PropsWithChildren<{ reduceGraphics: boolean }>) {
  const $isPanningRef = useRef<WritableAtom<boolean>>(null)
  if (!$isPanningRef.current) {
    $isPanningRef.current = atom(reduceGraphics)
  }
  return (
    <PanningAtomSafeCtx value={$isPanningRef.current}>
      <ReduceGraphicsModeCtx value={reduceGraphics}>
        {children}
      </ReduceGraphicsModeCtx>
    </PanningAtomSafeCtx>
  )
}

export function useIsPanning() {
  return useStore(usePanningAtom())
}
