import { cx } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { type PropsWithChildren, createContext, createRef, useContext, useEffect, useRef } from 'react'
import { usePanningAtom } from './ReduceGraphics'

const RootContainerContext = createContext(createRef<HTMLDivElement>())

export function RootContainer({
  className,
  reduceGraphics = false,
  children,
}: PropsWithChildren<{
  className?: string | undefined
  reduceGraphics?: boolean
}>) {
  const ref = useRef<HTMLDivElement>(null)
  const $isPanning = usePanningAtom()

  useEffect(() => {
    return $isPanning.listen((isPanning) => {
      if (isPanning) {
        ref.current?.setAttribute('data-likec4-diagram-panning', 'true')
      } else {
        ref.current?.removeAttribute('data-likec4-diagram-panning')
      }
    })
  }, [$isPanning])

  return (
    <Box
      className={cx('likec4-root', className)}
      ref={ref}
      {...reduceGraphics && {
        ['data-likec4-reduced-graphics']: true,
      }}>
      <RootContainerContext.Provider value={ref}>
        {children}
      </RootContainerContext.Provider>
    </Box>
  )
}

export function useRootContainerRef() {
  return useContext(RootContainerContext)
}

/**
 * NOTE: Non-reactive
 */
export function useRootContainer() {
  return useContext(RootContainerContext).current
}
