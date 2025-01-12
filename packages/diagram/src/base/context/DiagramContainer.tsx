import { Box } from '@mantine/core'
import { type PropsWithChildren, createContext, useCallback, useContext, useRef } from 'react'
import { rootClassName } from '../../globals.css'

const DiagramContainerContext = createContext<() => HTMLDivElement | null>(
  () => null,
)

export function DiagramContainer({
  className = rootClassName,
  children,
}: PropsWithChildren<{ className?: string }>) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <Box className={className} ref={ref}>
      <DiagramContainerContext value={useCallback(() => ref.current, [ref])}>
        {children}
      </DiagramContainerContext>
    </Box>
  )
}

export function useGetDiagramContainer() {
  return useContext(DiagramContainerContext)
}
export function useDiagramContainer() {
  return useContext(DiagramContainerContext)()
}
