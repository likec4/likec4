import { invariant } from '@likec4/core'
import { useDebouncedEffect } from '@react-hookz/web'
import { shallowEqual } from 'fast-equals'
import { useEffect, useRef } from 'react'
import { type DiagramState, type DiagramStoreApi, useDiagramState, useDiagramStoreApi } from '../state/hooks'
import { useXYStore, useXYStoreApi, type XYStoreApi } from './hooks/useXYFlow'
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
      fitDiagram(300)
      prevDimensionsRef.current = dimensions
    },
    [dimensions, diagramApi, xyflowApi],
    300,
    1000
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
  } = useDiagramState(selector, shallowEqual)
  const diagramApi = useDiagramStoreApi()
  const processedRef = useRef(pendingViewId)
  const durationRef = useRef(300)

  useEffect(() => {
    if (!xyflowSynced || pendingViewId === processedRef.current) {
      return
    }
    if (waitCorrection) {
      invariant(elTo, 'elTo should be defined')
      invariant(elFrom, 'elFrom should be defined')
      const { xyflow, lastOnNavigate } = diagramApi.getState()
      invariant(lastOnNavigate, 'lastOnNavigate should be defined')
      const fromPos = lastOnNavigate.elementScreenPosition
      const toPos = xyflow.flowToScreenPosition({
          x: elTo.position[0], // + elFrom.width / 2,
          y: elTo.position[1] // + elFrom.height / 2
        }),
        diff = {
          x: toDomPrecision(fromPos.x - toPos.x),
          y: toDomPrecision(fromPos.y - toPos.y)
        }
      xyflowApi.getState().panBy(diff)
      durationRef.current = 500
      diagramApi.setState({ lastOnNavigate: null })
      return
    }
    processedRef.current = pendingViewId
    diagramApi.getState().fitDiagram(durationRef.current)
    // Reset duration
    durationRef.current = 300
  }, [pendingViewId, xyflowSynced, waitCorrection])

  if (!viewportChanged && xyflowSynced) {
    return <FitViewOnViewportResize xyflowApi={xyflowApi} diagramApi={diagramApi} />
  }
  return null
}
