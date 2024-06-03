import { useDebouncedEffect } from '@react-hookz/web'
import { useEffect, useRef } from 'react'
import { type DiagramState, type DiagramStoreApi, useDiagramState, useDiagramStoreApi } from '../state'
import { useXYStore, useXYStoreApi, type XYStoreApi } from './hooks'
import type { XYFlowState } from './types'
import { toDomPrecision } from './utils'

function selectDimensions(state: XYFlowState) {
  return `${Math.round(state.width)}:${Math.round(state.height)}`
}

function FitViewOnViewportResize({ diagramApi, xyflowApi }: {
  xyflowApi: XYStoreApi
  diagramApi: DiagramStoreApi
}) {
  const dimensions = useXYStore(selectDimensions)
  const prevDimensionsRef = useRef(dimensions)

  useDebouncedEffect(
    () => {
      const { focusedNodeId, fitDiagram } = diagramApi.getState()
      if (focusedNodeId || prevDimensionsRef.current === dimensions) {
        return
      }
      fitDiagram(xyflowApi)
      prevDimensionsRef.current = dimensions
    },
    [dimensions],
    200,
    800
  )

  return null
}

function selector({ view, xyflowSynced, viewportChanged, lastOnNavigate, ...s }: DiagramState) {
  const viewId = view.id + '_' + view.autoLayout + '_' + s.fitViewPadding

  const waitCorrection = lastOnNavigate && lastOnNavigate.toView === view.id
    && lastOnNavigate.positionCorrected === false
  const elTo = waitCorrection ? view.nodes.find(n => n.id === lastOnNavigate.element.id) : undefined
  if (waitCorrection && elTo) {
    return {
      viewId,
      xyflowSynced,
      viewportChanged,
      waitCorrection: true,
      elFrom: lastOnNavigate.element,
      elTo
    }
  }

  return {
    viewId,
    xyflowSynced,
    viewportChanged,
    waitCorrection: false,
    fromElement: null,
    toElement: null
  }
}

/**
 * Fits the view when the view changes and nodes are initialized
 */
export function FitViewOnDiagramChange() {
  const xyflowApi = useXYStoreApi()
  const {
    viewId: pendingViewId,
    xyflowSynced,
    viewportChanged,
    waitCorrection,
    elFrom,
    elTo
  } = useDiagramState(selector)
  const diagramApi = useDiagramStoreApi()
  const processedRef = useRef(pendingViewId)

  useEffect(() => {
    if (!xyflowSynced || pendingViewId === processedRef.current) {
      return
    }
    if (waitCorrection && elTo && elFrom) {
      const [x, y, zoom] = xyflowApi.getState().transform
      const { xyflow, lastOnNavigate } = diagramApi.getState()
      const nextZoom = Math.min(
        elFrom.width / elTo.width,
        elFrom.height / elTo.height
      )
      const centerFrom = lastOnNavigate!.elementCenterScreenPosition
      if (nextZoom !== 1 && nextZoom < zoom) {
        xyflowApi.setState({ transform: [x, y, nextZoom] })
        xyflow.setViewport({
          x,
          y,
          zoom: nextZoom
        })
      }
      const centerTo = xyflow.flowToScreenPosition({
          x: elTo.position[0] + elTo.width / 2,
          y: elTo.position[1] + elTo.height / 2
        }),
        diff = {
          x: toDomPrecision(centerFrom.x - centerTo.x),
          y: toDomPrecision(centerFrom.y - centerTo.y)
        }
      xyflowApi.getState().panBy(diff)
      diagramApi.setState({ lastOnNavigate: null })
      return
    }
    processedRef.current = pendingViewId
    diagramApi.getState().fitDiagram(xyflowApi)
  }, [pendingViewId, xyflowSynced, waitCorrection])

  if (!viewportChanged && xyflowSynced && pendingViewId === processedRef.current) {
    return <FitViewOnViewportResize xyflowApi={xyflowApi} diagramApi={diagramApi} />
  }
  return null
}
