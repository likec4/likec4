import { cx } from '@likec4/styles/css'
import { Overlay } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { useStore } from '@nanostores/react'
import { atom } from 'nanostores'
import { type PropsWithChildren, useMemo, useRef, useState } from 'react'
import { RootContainerContextProvider } from '../context/RootContainerContext'

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
  const [$isBusy] = useState(() => atom(false))
  const isPanning = useStore($isPanning)
  const [isBusy] = useDebouncedValue(
    useStore($isBusy),
    300,
  )

  const ctx = useMemo(
    () => ({
      id,
      ref,
      selector: `#${id}`,
      reducedGraphics: reduceGraphics,
      $panning: $isPanning,
      $busy: $isBusy,
    }),
    [id, ref, reduceGraphics, $isPanning, $isBusy],
  )

  return (
    <div
      id={id}
      className={cx('likec4-root', className)}
      ref={ref}
      data-likec4-diagram-panning={isPanning}
      {...(isBusy && { 'data-likec4-busy': true })}
      {...(reduceGraphics && {
        ['data-likec4-reduced-graphics']: true,
      })}>
      <RootContainerContextProvider value={ctx}>
        {children}
      </RootContainerContextProvider>
      {isBusy && <Overlay opacity={0.7} />}
    </div>
  )
}
