import type { EdgeMouseHandler, NodeMouseHandler, OnMoveEnd, OnMoveStart, Viewport } from '@xyflow/react'
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
        } else {
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
      diagramApi.setState({ lastClickedNodeId: xynode.id }, false, 'lastClickedNodeId')
      diagramApi.getState().onNodeContextMenu?.({
        element: xynode.data.element,
        xynode,
        event
      })
    },
    onPaneContextMenu: (event) => {
      diagramApi.setState(
        {
          lastClickedNodeId: null,
          lastClickedEdgeId: null
        },
        false,
        'onPaneClick'
      )
      diagramApi.getState().onCanvasContextMenu?.(event as any)
    },
    onEdgeContextMenu: (event, xyedge) => {
      diagramApi.setState({ lastClickedEdgeId: xyedge.id }, false, 'lastClickedEdgeId')
      diagramApi.getState().onEdgeContextMenu?.({
        relation: xyedge.data.edge,
        xyedge,
        event
      })
    },
    onNodeClick: (event, xynode) => {
      if (diagramApi.getState().lastClickedNodeId !== xynode.id) {
        diagramApi.setState({ lastClickedNodeId: xynode.id }, false, 'lastClickedNodeId')
      }
      const { onNodeClick, onCanvasClick } = diagramApi.getState()
      if (onNodeClick) {
        onNodeClick({
          element: xynode.data.element,
          xynode,
          event
        })
      } else {
        onCanvasClick?.(event)
      }
    },
    onEdgeClick: (event, xyedge) => {
      if (diagramApi.getState().lastClickedEdgeId !== xyedge.id) {
        diagramApi.setState({ lastClickedEdgeId: xyedge.id }, false, 'lastClickedEdgeId')
      }
      const { onEdgeClick, onCanvasClick } = diagramApi.getState()
      if (onEdgeClick) {
        onEdgeClick({
          relation: xyedge.data.edge,
          xyedge,
          event
        })
      } else {
        onCanvasClick?.(event)
      }
    },
    onMoveEnd: (event, _viewport) => {
      const viewportChanged = !!event
      if (viewportChanged !== diagramApi.getState().viewportChanged) {
        diagramApi.setState({ viewportChanged }, false, `viewport-changed: ${viewportChanged}`)
      }
    }
  }), [diagramApi, xyflowApi])
}
