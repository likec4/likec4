import { cx } from '@likec4/styles/css'
import { useIsMounted } from '@react-hookz/web'
import { atom } from 'nanostores'
import { type PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react'
import {
  PanningAtomSafeCtx,
  ReduceGraphicsModeProvider,
  RootContainerContextProvider,
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
  const isMounted = useIsMounted()
  const ref = useRef<HTMLDivElement>(null)

  const [$isPanning] = useState(() => atom(false))

  useEffect(() => {
    return $isPanning.listen((isPanning) => {
      if (!isMounted()) {
        return
      }
      // Chnage DOM attribute to avoid re-rendering
      ref.current?.setAttribute('data-likec4-diagram-panning', isPanning ? 'true' : 'false')
    })
  }, [$isPanning])

  const ctx = useMemo(() => ({ id, ref, selector: `#${id}` }), [id, ref])

  return (
    <ReduceGraphicsModeProvider value={reduceGraphics}>
      <PanningAtomSafeCtx value={$isPanning}>
        <div
          id={id}
          className={cx('likec4-root', className)}
          ref={ref}
          {...reduceGraphics && {
            ['data-likec4-reduced-graphics']: true,
          }}>
          <RootContainerContextProvider value={ctx}>
            {children}
          </RootContainerContextProvider>
        </div>
      </PanningAtomSafeCtx>
    </ReduceGraphicsModeProvider>
  )
}
