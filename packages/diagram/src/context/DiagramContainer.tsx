import { Box } from '@mantine/core'
import clsx from 'clsx'
import { type PropsWithChildren, createContext, useCallback, useContext, useRef } from 'react'
import { rootClassName } from '../globals.css'

const DiagramContainerContext = createContext<() => HTMLDivElement | null>(
  () => null,
)

export function DiagramContainer({
  className,
  children,
}: PropsWithChildren<{ className: string | undefined }>) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <Box className={clsx(rootClassName, className)} ref={ref}>
      <DiagramContainerContext.Provider value={useCallback(() => ref.current, [ref])}>
        {children}
      </DiagramContainerContext.Provider>
    </Box>
  )
}

export function useGetDiagramContainer() {
  return useContext(DiagramContainerContext)
}
export function useDiagramContainer() {
  return useContext(DiagramContainerContext)()
}
