import type { EdgeMouseHandler, NodeMouseHandler, OnMoveEnd, OnMoveStart, Viewport } from '@xyflow/react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { useMemo, useRef } from 'react'
import { useDiagramStoreApi } from '../store'
import { useXYStoreApi } from './hooks'
import type { XYFlowEdge, XYFlowNode } from './types'

type XYFlowEventHandlers = {
  onPaneClick: (event: ReactMouseEvent) => void
  onNodeContextMenu: NodeMouseHandler<XYFlowNode>
  onEdgeContextMenu: EdgeMouseHandler<XYFlowEdge>
  onPaneContextMenu: (event: ReactMouseEvent | MouseEvent) => void
  onNodeClick: NodeMouseHandler<XYFlowNode>
  onEdgeClick: EdgeMouseHandler<XYFlowEdge>
  onMoveStart: OnMoveStart
  onMoveEnd: OnMoveEnd
}

export function useXYFlowEvents() {
  const diagramApi = useDiagramStoreApi()
  const xyflowApi = useXYStoreApi()

  const dblclickTimeout = useRef<number>()

  const viewportOnMoveStart = useRef<Viewport>()

  return useMemo<XYFlowEventHandlers>(() => ({
    onPaneClick: (event) => {
      const diagramState = diagramApi.getState()
      if (!diagramState.onCanvasDblClick && !!diagramState.onCanvasClick) {
        diagramState.onCanvasClick(event)
        return
      }

      if (dblclickTimeout.current) {
        window.clearTimeout(dblclickTimeout.current)
        dblclickTimeout.current = undefined
        if (diagramState.onCanvasDblClick) {
          diagramState.onCanvasDblClick(event)
        } else {
          xyflowApi.getState().fitView({
            duration: 350,
            includeHiddenNodes: true
          })
        }
        return
      }

      dblclickTimeout.current = window.setTimeout(() => {
        dblclickTimeout.current = undefined
        diagramState.onCanvasClick?.(event)
      }, 300)
    },
    onNodeContextMenu: (event, xynode) => {
      const diagramState = diagramApi.getState()
      diagramState.onNodeContextMenu?.({
        element: xynode.data.element,
        xynode,
        event
      })
    },
    onPaneContextMenu: (event) => {
      const diagramState = diagramApi.getState()
      diagramState.onCanvasContextMenu?.(event as any)
    },
    onEdgeContextMenu: (event, xyedge) => {
      const diagramState = diagramApi.getState()
      diagramState.onEdgeContextMenu?.({
        relation: xyedge.data.edge,
        xyedge,
        event
      })
    },
    onNodeClick: (event, xynode) => {
      const diagramState = diagramApi.getState()
      diagramState.onNodeClick?.({
        element: xynode.data.element,
        xynode,
        event
      })
    },
    onEdgeClick: (event, xyedge) => {
      const diagramState = diagramApi.getState()
      diagramState.onEdgeClick?.({
        relation: xyedge.data.edge,
        xyedge,
        event
      })
    },
    onMoveStart: (_event, viewport) => {
      viewportOnMoveStart.current = viewport
    },
    onMoveEnd: (event, _viewport) => {
      diagramApi.setState({ viewportMoved: !!event })
      viewportOnMoveStart.current = undefined
    }
  }), [diagramApi, xyflowApi])
}
