import { Box } from '@mantine/core'
import clsx from 'clsx'
import { type PropsWithChildren, createContext, createRef, useContext, useRef } from 'react'
import { rootClassName } from '../globals.css'
import { useIsReducedGraphics } from '../hooks/useIsReducedGraphics'

const RootContainerContext = createContext(createRef<HTMLDivElement>())

export function RootContainer({
  className,
  children,
}: PropsWithChildren<{ className?: string | undefined }>) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceGraphics = useIsReducedGraphics()
  return (
    <Box
      className={clsx(rootClassName, className)}
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
