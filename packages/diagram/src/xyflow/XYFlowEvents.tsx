import type { ReactFlowProps } from '@xyflow/react'
import { useMemo, useRef } from 'react'
import type { Simplify } from 'type-fest'
import { useDiagramStoreApi } from '../state'
import { useXYStoreApi } from './hooks'
import type { XYFlowEdge, XYFlowNode } from './types'

type XYFlowEventHandlers = Simplify<
  Required<
    Pick<
      ReactFlowProps<XYFlowNode, XYFlowEdge>,
      | 'onDoubleClick'
      | 'onPaneClick'
      | 'onNodeClick'
      | 'onNodeDoubleClick'
      | 'onEdgeClick'
      | 'onMoveEnd'
      | 'onNodeContextMenu'
      | 'onEdgeContextMenu'
      | 'onPaneContextMenu'
      | 'onNodeMouseEnter'
      | 'onNodeMouseLeave'
      | 'onEdgeMouseEnter'
      | 'onEdgeMouseLeave'
    >
  >
>

export function useXYFlowEvents() {
  const diagramApi = useDiagramStoreApi()
  const xyflowApi = useXYStoreApi()

  const dblclickTimeout = useRef<number>()

  const dbclickGuarg = () => {
    if (dblclickTimeout.current !== undefined) {
      return true
    }
    dblclickTimeout.current = window.setTimeout(() => {
      dblclickTimeout.current = undefined
    }, 250)
    return false
  }

  return useMemo<XYFlowEventHandlers>(() => ({
    onDoubleClick: (event) => {
      diagramApi.getState().setLastClickedNode(null)
      diagramApi.getState().setLastClickedEdge(null)
      const diagramState = diagramApi.getState()
      if (diagramState.onCanvasDblClick) {
        diagramState.onCanvasDblClick(event)
        return
      }
      if (diagramState.fitViewEnabled && diagramState.zoomable) {
        diagramState.fitDiagram()
        event.stopPropagation()
        return
      }
    },
    onPaneClick: (event) => {
      if (dbclickGuarg()) {
        return
      }
      diagramApi.getState().setLastClickedNode(null)
      diagramApi.getState().setLastClickedEdge(null)
      const { focusedNodeId, fitDiagram, onCanvasClick } = diagramApi.getState()
      if (onCanvasClick) {
        onCanvasClick(event)
        return
      }
      // reset focus if clicked on empty space
      if (focusedNodeId) {
        fitDiagram()
        event.stopPropagation()
      }
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
      const { focusedNodeId, fitDiagram, onNodeClick } = diagramApi.getState()
      if (onNodeClick) {
        onNodeClick({
          element: xynode.data.element,
          xynode,
          event
        })
        return
      }
      // if we clicked on a node that is not focused, fit the diagram
      if (!!focusedNodeId && focusedNodeId !== xynode.id) {
        fitDiagram(xynode)
        event.stopPropagation()
      }
    },
    onNodeDoubleClick: (event, xynode) => {
      const { zoomable, fitDiagram, onNodeClick } = diagramApi.getState()
      if (onNodeClick) {
        return
      }
      if (zoomable) {
        fitDiagram(xynode)
        event.stopPropagation()
      }
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
      // if event is present, the move was triggered by user
      const viewportChanged = !!event
      if (viewportChanged !== diagramApi.getState().viewportChanged) {
        diagramApi.setState({ viewportChanged }, false, `viewport-changed: ${viewportChanged}`)
      }
    },
    onNodeMouseEnter: (event, xynode) => {
      diagramApi.getState().setHoveredNode(xynode.id)
    },
    onNodeMouseLeave: (event, xynode) => {
      diagramApi.getState().setHoveredNode(null)
    },
    onEdgeMouseEnter: (event, xyedge) => {
      diagramApi.getState().setHoveredEdge(xyedge.id)
    },
    onEdgeMouseLeave: (event, xyedge) => {
      diagramApi.getState().setHoveredEdge(null)
    }
  }), [diagramApi, xyflowApi])
}
