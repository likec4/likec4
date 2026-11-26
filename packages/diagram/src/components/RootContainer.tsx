import { cx } from '@likec4/styles/css'
import { useStore } from '@nanostores/react'
import { useUnmountEffect } from '@react-hookz/web'
import { atom } from 'nanostores'
import { type PropsWithChildren, useEffectEvent, useMemo, useRef, useState } from 'react'
import {
  type RootContainerContextType,
  RootContainerContextProvider,
} from '../context/RootContainerContext'

function usePanningState(reduceGraphics: boolean) {
  const [$panning] = useState(() => atom(false))

  const isPanning = useRef(false)
  const startPanningTimer = useRef<number | null>(null)
  const stopPanningTimer = useRef<number | null>(null)

  const cancelStartPanning = useEffectEvent(() => {
    if (startPanningTimer.current) {
      clearTimeout(startPanningTimer.current)
      startPanningTimer.current = null
    }
  })
  const cancelStopPanning = useEffectEvent(() => {
    if (stopPanningTimer.current) {
      clearTimeout(stopPanningTimer.current)
      stopPanningTimer.current = null
    }
  })

  const updateAtom = useEffectEvent(() => {
    $panning.set(isPanning.current)
  })

  useUnmountEffect(() => {
    cancelStartPanning()
    cancelStopPanning()
  })

  return useMemo(() => {
    const startPanning = () => {
      isPanning.current = true
      cancelStopPanning()
      // if not already panning
      if ($panning.value !== true) {
        startPanningTimer.current ??= window.setTimeout(() => {
          updateAtom()
          startPanningTimer.current = null
        }, reduceGraphics ? 200 : 1500)
      }
    }

    const stopPanning = () => {
      cancelStopPanning()
      let delay = 150
      // in reduced graphics mode, we want to keep panning state for a bit longer
      // to avoid flickering when user stops panning
      if (reduceGraphics) {
        delay = 400
      }
      // debounce stop panning to avoid flickering
      stopPanningTimer.current = window.setTimeout(() => {
        isPanning.current = false
        stopPanningTimer.current = null
        // The pending start timer is kept on purpose: it publishes `isPanning.current`, not `true`.
        // If panning resumes before it fires (moveStart -> moveEnd -> moveStart),
        // the gesture keeps the original activation deadline instead of waiting for a new delay.
        // there was no start panning event and we are still panning - update atom
        if (!startPanningTimer.current) {
          updateAtom()
        }
      }, delay)
    }

    const resetPanning = () => {
      cancelStartPanning()
      cancelStopPanning()
      isPanning.current = false
      $panning.set(false)
    }

    return {
      $panning,
      startPanning,
      stopPanning,
      resetPanning,
    }
  }, [$panning, reduceGraphics])
}

export function RootContainer({
  id,
  className,
  reduceGraphics = false,
  children,
}: PropsWithChildren<{
  id: string
  className?: string | undefined
  reduceGraphics?: boolean
}>) {
  const ref = useRef<HTMLDivElement>(null)

  const panningState = usePanningState(reduceGraphics)

  const ctx = useMemo(
    (): RootContainerContextType => ({
      id,
      ref,
      selector: `#${id}`,
      reducedGraphics: reduceGraphics,
      ...panningState,
    }),
    [id, ref, reduceGraphics, panningState],
  )

  return (
    <div
      id={id}
      className={cx('likec4-root', className)}
      ref={ref}
      data-likec4-diagram-panning={useStore(panningState.$panning)}
      {...(reduceGraphics && {
        ['data-likec4-reduced-graphics']: true,
      })}>
      <RootContainerContextProvider value={ctx}>
        {children}
      </RootContainerContextProvider>
    </div>
  )
}
