import type { EdgeMouseHandler, NodeMouseHandler, OnMoveEnd } from '@xyflow/react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { useMemo, useRef } from 'react'
import { useDiagramStoreApi } from '../state'
import { useXYStoreApi } from './hooks'
import type { XYFlowEdge, XYFlowNode } from './types'

type XYFlowEventHandlers = {
  onPaneClick: (event: ReactMouseEvent) => void
  onNodeContextMenu: NodeMouseHandler<XYFlowNode>
  onEdgeContextMenu: EdgeMouseHandler<XYFlowEdge>
  onPaneContextMenu: (event: ReactMouseEvent | MouseEvent) => void
  onNodeClick: NodeMouseHandler<XYFlowNode>
  onEdgeClick: EdgeMouseHandler<XYFlowEdge>
  // onMoveStart: OnMoveStart
  onMoveEnd: OnMoveEnd
}

export function useXYFlowEvents() {
  const diagramApi = useDiagramStoreApi()
  const xyflowApi = useXYStoreApi()

  const dblclickTimeout = useRef<number>()

  return useMemo<XYFlowEventHandlers>(() => ({
    onPaneClick: (event) => {
      diagramApi.setState(
        {
          lastClickedNodeId: null,
          lastClickedEdgeId: null
        },
        false,
        'onPaneClick'
      )
      const diagramState = diagramApi.getState()

      if (dblclickTimeout.current) {
        window.clearTimeout(dblclickTimeout.current)
        dblclickTimeout.current = undefined
        if (diagramState.onCanvasDblClick) {
          diagramState.onCanvasDblClick(event)
          return
        }
        diagramState.onCanvasClick?.(event)
        if (diagramState.fitViewEnabled && diagramState.viewportChanged) {
          diagramState.fitDiagram()
        }
        return
      }

      dblclickTimeout.current = window.setTimeout(() => {
        dblclickTimeout.current = undefined
        diagramApi.getState().onCanvasClick?.(event)
      }, 300)
    },
    onNodeContextMenu: (event, xynode) => {
      diagramApi.getState().setLastClickedNode(xynode.id)
      diagramApi.getState().onNodeContextMenu?.({
        element: xynode.data.element,
        xynode,
        event
      })
    },
    onPaneContextMenu: (event) => {
      diagramApi.getState().setLastClickedNode(null)
      diagramApi.getState().setLastClickedEdge(null)
      diagramApi.getState().onCanvasContextMenu?.(event as any)
    },
    onEdgeContextMenu: (event, xyedge) => {
      diagramApi.getState().setLastClickedEdge(xyedge.id)
      diagramApi.getState().onEdgeContextMenu?.({
        relation: xyedge.data.edge,
        xyedge,
        event
      })
    },
    onNodeClick: (event, xynode) => {
      diagramApi.getState().setLastClickedNode(xynode.id)
      diagramApi.getState().onNodeClick?.({
        element: xynode.data.element,
        xynode,
        event
      })
    },
    onEdgeClick: (event, xyedge) => {
      diagramApi.getState().setLastClickedEdge(xyedge.id)
      diagramApi.getState().onEdgeClick?.({
        relation: xyedge.data.edge,
        xyedge,
        event
      })
    },
    onMoveEnd: (event, _viewport) => {
      const viewportChanged = !!event
      if (viewportChanged !== diagramApi.getState().viewportChanged) {
        diagramApi.setState({ viewportChanged }, false, `viewport-changed: ${viewportChanged}`)
      }
    }
  }), [diagramApi, xyflowApi])
}
