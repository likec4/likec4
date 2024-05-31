import { useDebouncedCallback, useDebouncedEffect, useRafEffect } from '@react-hookz/web'
import { useNodesInitialized, useOnViewportChange } from '@xyflow/react'
import { memo, useEffect, useRef, useState } from 'react'
import { type DiagramState, type DiagramStoreApi, useDiagramState, useDiagramStoreApi } from '../state'
import { useXYStore, useXYStoreApi } from './hooks'
import type { XYFlowState } from './types'

function selectDimensions(state: XYFlowState) {
  return `${Math.round(state.width)}:${Math.round(state.height)}`
}

function FitViewOnViewportResize({ diagramApi }: { diagramApi: DiagramStoreApi }) {
  const dimensions = useXYStore(selectDimensions)
  const prevDimensionsRef = useRef(dimensions)

  useDebouncedEffect(
    () => {
      if (prevDimensionsRef.current === dimensions) {
        return
      }
      diagramApi.getState().fitDiagram()
      prevDimensionsRef.current = dimensions
    },
    [dimensions],
    150
  )

  return null
}

const diagramChangeId = (s: DiagramState) => s.view.id + '_' + s.view.autoLayout + '_' + s.fitViewPadding

/**
 * Fits the view when the view changes and nodes are initialized
 */
function FitViewOnDiagramChanges() {
  const xyflowApi = useXYStoreApi()
  const diagramApi = useDiagramStoreApi()
  const [viewportMoved, setViewportMoved] = useState(diagramApi.getState().viewportChanged)
  const [processedChangeId, setProcessed] = useState(diagramChangeId(diagramApi.getState()))
  const [pendingChangeId, setPending] = useState(processedChangeId)

  const isReady = useNodesInitialized({
    includeHiddenNodes: true
  })

  const schedulePending = useDebouncedCallback(
    (pendingChangeId: string) => {
      setPending(pendingChangeId)
    },
    [setPending],
    75
  )

  useEffect(
    () =>
      diagramApi.subscribe(
        s => diagramChangeId(s),
        schedulePending
      ),
    [diagramApi, schedulePending]
  )

  useEffect(
    () =>
      diagramApi.subscribe(
        s => s.viewportChanged,
        setViewportMoved
      ),
    [diagramApi, setViewportMoved]
  )

  useRafEffect(
    () => {
      if (!isReady || processedChangeId === pendingChangeId) {
        return
      }
      diagramApi.getState().fitDiagram()
      setProcessed(pendingChangeId)
    },
    [isReady, processedChangeId, pendingChangeId, diagramApi]
  )

  /**
   * WORKAROUND - Called on viewport change
   * Viewport transform is not rounded to integers which results in blurry nodes on some resolution
   * https://github.com/xyflow/xyflow/issues/3282
   * https://github.com/likec4/likec4/issues/734
   */
  useOnViewportChange({
    onEnd: ({ x, y, zoom }) => {
      const roundedX = Math.round(x), roundedY = Math.round(y)
      if (x !== roundedX || y !== roundedY) {
        xyflowApi.setState({ transform: [roundedX, roundedY, zoom] })
      }
    }
  })

  if (!viewportMoved && isReady) {
    return <FitViewOnViewportResize diagramApi={diagramApi} />
  }
  return null
}

const selectFitViewFlag = (s: DiagramState) => s.fitViewEnabled

export const FitViewOnDiagramChange = memo(() => {
  const fitView = useDiagramState(selectFitViewFlag)

  if (!fitView) {
    return null
  }

  return <FitViewOnDiagramChanges />
})
