import { cx } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { useId } from '@mantine/hooks'
import { type PropsWithChildren, createContext, createRef, useContext, useEffect, useRef } from 'react'
import { usePanningAtom } from './ReduceGraphics'
import { TagStylesProvider } from './TagStylesContext'

const RootContainerContext = createContext(createRef<HTMLDivElement>())

export function RootContainer({
  className,
  reduceGraphics = false,
  children,
}: PropsWithChildren<{
  className?: string | undefined
  reduceGraphics?: boolean
}>) {
  const id = useId()
  const ref = useRef<HTMLDivElement>(null)
  const $isPanning = usePanningAtom()

  useEffect(() => {
    return $isPanning.listen((isPanning) => {
      ref.current?.setAttribute('data-likec4-diagram-panning', isPanning ? 'true' : 'false')
    })
  }, [$isPanning])

  return (
    <Box
      id={id}
      className={cx('likec4-root', className)}
      ref={ref}
      {...reduceGraphics && {
        ['data-likec4-reduced-graphics']: true,
      }}>
      <TagStylesProvider rootSelector={`#${id}`}>
        <RootContainerContext.Provider value={ref}>
          {children}
        </RootContainerContext.Provider>
      </TagStylesProvider>
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
