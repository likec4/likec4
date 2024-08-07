import { useDebouncedEffect } from '@react-hookz/web'
import { shallowEqual } from 'fast-equals'
import { useRef, useState } from 'react'
import { type DiagramState, type DiagramStoreApi, useDiagramState, useDiagramStoreApi } from '../state/hooks'
import { useXYStore } from './hooks/useXYFlow'

function selectXYFlowSize(state: { width: number; height: number }): string {
  return `${Math.round(state.width)}:${Math.round(state.height)}`
}

function selectDiagramsize({ view, fitViewPadding }: DiagramState) {
  return selectXYFlowSize(view) + ':' + fitViewPadding
}

function FitViewOnViewportResize({ diagramApi }: {
  diagramApi: DiagramStoreApi
}) {
  const xyflowsize = useXYStore(selectXYFlowSize)
  const viewsize = useDiagramState(selectDiagramsize)
  const dimensions = xyflowsize + viewsize
  const prevDimensionsRef = useRef(dimensions)

  useDebouncedEffect(
    () => {
      const { focusedNodeId, fitDiagram } = diagramApi.getState()
      if (focusedNodeId || prevDimensionsRef.current === dimensions) {
        return
      }
      prevDimensionsRef.current = dimensions
      fitDiagram(250)
    },
    [dimensions, diagramApi],
    250,
    1000
  )

  return null
}

function selector({ view, viewportChanged, fitViewPadding }: DiagramState) {
  return {
    layoutId: view.id + '_' + view.autoLayout + '_' + fitViewPadding,
    viewportNotMoved: !viewportChanged
  }
}

/**
 * Fits the view when diagram changes
 */
export function FitViewOnDiagramChange() {
  const {
    layoutId,
    viewportNotMoved
  } = useDiagramState(selector, shallowEqual)
  const diagramApi = useDiagramStoreApi()
  const [currentLayoutId, setCurrent] = useState(layoutId)

  const requiresFit = layoutId !== currentLayoutId

  useDebouncedEffect(
    () => {
      if (layoutId === currentLayoutId) {
        return
      }
      setCurrent(layoutId)
      diagramApi.getState().fitDiagram(450)
    },
    [requiresFit, diagramApi],
    50
  )

  if (viewportNotMoved && !requiresFit) {
    return <FitViewOnViewportResize diagramApi={diagramApi} />
  }
  return null
}
