import { cx } from '@likec4/styles/css'
import { useIsomorphicLayoutEffect } from '@react-hookz/web'
import { type WritableAtom, atom } from 'nanostores'
import { type PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react'
import {
  PanningAtomSafeCtx,
  ReduceGraphicsModeCtx,
  RootContainerContext,
} from '../context/RootContainerContext'

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
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const $isPanningRef = useRef<WritableAtom<boolean>>(null)
  if (!$isPanningRef.current) {
    $isPanningRef.current = atom(false)
  }

  useIsomorphicLayoutEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    return $isPanningRef.current?.subscribe((isPanning) => {
      // Chnage DOM attribute to avoid re-rendering
      ref.current?.setAttribute('data-likec4-diagram-panning', isPanning ? 'true' : 'false')
    })
  }, [])

  const ctx = useMemo(() => ({ id, ref }), [id, ref])

  return (
    <PanningAtomSafeCtx value={$isPanningRef.current}>
      <ReduceGraphicsModeCtx.Provider value={reduceGraphics}>
        <div
          id={id}
          className={cx('likec4-root', className)}
          ref={ref}
          {...reduceGraphics && {
            ['data-likec4-reduced-graphics']: true,
          }}>
          {mounted && !!ctx.ref.current && (
            <RootContainerContext.Provider value={ctx}>
              {children}
            </RootContainerContext.Provider>
          )}
        </div>
      </ReduceGraphicsModeCtx.Provider>
    </PanningAtomSafeCtx>
  )
}
