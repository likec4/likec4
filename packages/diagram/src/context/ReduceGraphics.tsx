import { createOptionalContext, createSafeContext } from '@mantine/core'
import { useDebouncedCallback, useTimeout } from '@mantine/hooks'
import { useStore } from '@nanostores/react'
import { useStoreApi } from '@xyflow/react'
import { type Atom, type WritableAtom, atom } from 'nanostores'
import { type PropsWithChildren, useEffect, useMemo, useRef } from 'react'

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
const [LooseReduceGraphicsAtomCtx, useLooseReduceGraphicsAtom] = createOptionalContext<Atom<boolean>>()

const $defaultLooseReduceGraphics = atom(false)
/**
 * Reduce graphics when reduced mode is enabled and pan/zoom is active.
 */
export function useLooseReducedGraphics() {
  const $isPanning = useLooseReduceGraphicsAtom() ?? $defaultLooseReduceGraphics
  return useStore($isPanning)
}

export function ReduceGraphicsContext({ reduceGraphics, children }: PropsWithChildren<{ reduceGraphics: boolean }>) {
  // const isEnabledRef = useSyncedRef(reduceGraphics)

  const $isPanningRef = useRef<WritableAtom<boolean>>(null)
  if (!$isPanningRef.current) {
    $isPanningRef.current = atom(reduceGraphics)
  }

  const looseReduceGraphics = useMemo(() => {
    return reduceGraphics ? $isPanningRef.current! : atom(false)
  }, [reduceGraphics, $isPanningRef.current])

  return (
    <PanningAtomSafeCtx value={$isPanningRef.current}>
      <LooseReduceGraphicsAtomCtx value={looseReduceGraphics}>
        <ReduceGraphicsModeCtx value={reduceGraphics}>
          {children}
        </ReduceGraphicsModeCtx>
      </LooseReduceGraphicsAtomCtx>
    </PanningAtomSafeCtx>
  )
}

export function ReduceGraphicsViewportListener() {
  const store = useStoreApi()
  const $isPanning = usePanningAtom()

  const notPanning = useTimeout(() => {
    $isPanning.set(false)
  }, 150)

  useEffect(() => {
    store.setState({
      onViewportChangeStart: () => {
        notPanning.clear()
      },
      onViewportChange: () => {
        $isPanning.set(true)
      },
      onViewportChangeEnd: () => {
        notPanning.start()
      },
    })
  }, [$isPanning, store])

  return null
}
