import { getViewportForBounds } from '@xyflow/system'
import { useMemo } from 'react'
import { MinZoom } from '../base/const'
import { useGetDiagramContainer } from '../base/context/DiagramContainer'
import { useXYStoreApi } from '../hooks'
import { useDiagramActorRef } from './store'

export function useDiagram() {
  const xystore = useXYStoreApi()
  const actoref = useDiagramActorRef()
  const container = useGetDiagramContainer()

  return useMemo(() => {
    const fitDiagram = (duration = 500) => {
      const { fitViewPadding, view } = actoref.getSnapshot().context
      const rect = container()?.getBoundingClientRect()
      const { width, height, panZoom, transform } = xystore.getState()

      const bounds = view.bounds
      const maxZoom = Math.max(1, transform[2])
      console.log('fitView', { view, rect, bounds, width, height, maxZoom, fitViewPadding })
      const viewport = getViewportForBounds(
        bounds,
        rect?.width ?? width,
        rect?.height ?? height,
        MinZoom,
        maxZoom,
        fitViewPadding,
      )
      panZoom?.setViewport(viewport, duration > 0 ? { duration } : undefined)
    }

    return {
      actor: actoref,
      container,
      fitDiagram,
    }
  }, [actoref, xystore, container])
}
