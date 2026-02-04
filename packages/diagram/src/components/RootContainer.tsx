import { cx } from '@likec4/styles/css'
import { useStore } from '@nanostores/react'
import { atom } from 'nanostores'
import { type PropsWithChildren, useMemo, useRef, useState } from 'react'
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
  const ref = useRef<HTMLDivElement>(null)

  const [$isPanning] = useState(() => atom(false))
  const isPanning = useStore($isPanning)

  const ctx = useMemo(() => ({ id, ref, selector: `#${id}` }), [id, ref])

  return (
    <ReduceGraphicsModeProvider value={reduceGraphics}>
      <PanningAtomSafeCtx value={$isPanning}>
        <div
          id={id}
          className={cx('likec4-root', className)}
          ref={ref}
          data-likec4-diagram-panning={isPanning}
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
