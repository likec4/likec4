import { cx } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { type PropsWithChildren, useEffect, useMemo, useRef } from 'react'
import { usePanningAtom } from '../context/ReduceGraphics'
import { RootContainerContext } from '../context/RootContainerContext'

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
  const $isPanning = usePanningAtom()

  useEffect(() => {
    return $isPanning.listen((isPanning) => {
      ref.current?.setAttribute('data-likec4-diagram-panning', isPanning ? 'true' : 'false')
    })
  }, [$isPanning])

  const ctx = useMemo(() => ({ id, ref }), [id, ref.current])

  return (
    <Box
      id={id}
      className={cx('likec4-root', className)}
      ref={ref}
      {...reduceGraphics && {
        ['data-likec4-reduced-graphics']: true,
      }}>
      <RootContainerContext.Provider value={ctx}>
        {children}
      </RootContainerContext.Provider>
    </Box>
  )
}
