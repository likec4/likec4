import { Box } from '@mantine/core'
import clsx from 'clsx'
import { type PropsWithChildren, createContext, useCallback, useContext, useRef } from 'react'
import { rootClassName } from '../globals.css'

const RootContainerContext = createContext<() => HTMLDivElement | null>(
  () => null,
)

export function RootContainer({
  className,
  children,
}: PropsWithChildren<{ className?: string | undefined }>) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <Box className={clsx(rootClassName, className)} ref={ref}>
      <RootContainerContext.Provider value={useCallback(() => ref.current, [ref])}>
        {children}
      </RootContainerContext.Provider>
    </Box>
  )
}

export function useGetRootContainer() {
  return useContext(RootContainerContext)
}

/**
 * NOTE: Non-reactive
 */
export function useRootContainer() {
  return useContext(RootContainerContext)()
}
