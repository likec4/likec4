import { useDebouncedCallback } from '@react-hookz/web'
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
      | 'onViewportChange'
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

  /**
   * Called on viewport change
   * WOKAROUND:
   * Viewport transform is not rounded to integers which results in blurry nodes on some resolution
   * https://github.com/xyflow/xyflow/issues/3282
   */
  const fixViewportTransform = useDebouncedCallback(
    () => {
      const [x, y, zoom] = xyflowApi.getState().transform
      const roundedX = Math.round(x), roundedY = Math.round(y)
      if (x === roundedX && y === roundedY) {
        return
      }
      xyflowApi.setState({ transform: [roundedX, roundedY, zoom] })
    },
    [xyflowApi],
    50
  )

  // If we are in focused mode, on edge enter we want to "highlight" the other node
  // This ref contains the id of this node
  const hoveredNodeFromOnEdgeEnterRef = useRef('')

  return useMemo(() =>
    ({
      onDoubleClick: (event) => {
        const {
          fitViewEnabled,
          onCanvasDblClick,
          resetLastClicked,
          fitDiagram
        } = diagramApi.getState()
        if (fitViewEnabled) {
          fitDiagram()
          if (!onCanvasDblClick) {
            event.stopPropagation()
          }
        }
        resetLastClicked()
        onCanvasDblClick?.(event)
      },
      onPaneClick: (event) => {
        if (dbclickGuarg()) {
          return
        }
        const { focusedNodeId, fitDiagram, onCanvasClick, resetLastClicked } = diagramApi.getState()
        if (!!focusedNodeId) {
          fitDiagram()
          if (!onCanvasClick) {
            event.stopPropagation()
          }
        }
        resetLastClicked()
        onCanvasClick?.(event)
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
        diagramApi.getState().resetLastClicked()
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
        const {
          focusedNodeId,
          focusOnNode,
          onNodeClick,
          setLastClickedNode
        } = diagramApi.getState()
        setLastClickedNode(xynode.id)
        // if we focused on a node, and clicked on another node - focus on the clicked node
        if (!!focusedNodeId && focusedNodeId !== xynode.id) {
          focusOnNode(xynode.id)
          if (!onNodeClick) {
            // user did not provide a custom handler, stop propagation
            event.stopPropagation()
          }
        }
        onNodeClick?.({
          element: xynode.data.element,
          xynode,
          event
        })
      },
      onNodeDoubleClick: (event, xynode) => {
        const {
          focusedNodeId,
          zoomable,
          fitViewEnabled,
          fitDiagram,
          focusOnNode,
          setLastClickedNode
        } = diagramApi.getState()
        setLastClickedNode(xynode.id)
        if (!!focusedNodeId || (zoomable && fitViewEnabled)) {
          // if we are already focused on the node, cancel
          if (focusedNodeId === xynode.id) {
            fitDiagram()
          } else {
            focusOnNode(xynode.id)
          }
          event.stopPropagation()
        }
      },
      onEdgeClick: (event, xyedge) => {
        diagramApi.getState().setLastClickedEdge(xyedge.id)
        const { focusedNodeId, focusOnNode, onEdgeClick } = diagramApi.getState()
        // if we focused on a node, and clicked on an edge connected to it - focus on the other node
        if (focusedNodeId && (focusedNodeId === xyedge.source || focusedNodeId === xyedge.target)) {
          focusOnNode(focusedNodeId === xyedge.source ? xyedge.target : xyedge.source)
          if (!onEdgeClick) {
            // user did not provide a custom handler, stop propagation
            event.stopPropagation()
          }
        }
        onEdgeClick?.({
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
        hoveredNodeFromOnEdgeEnterRef.current = ''
        diagramApi.getState().setHoveredNode(xynode.id)
      },
      onNodeMouseLeave: (event, xynode) => {
        const { hoveredNodeId, setHoveredNode } = diagramApi.getState()
        if (hoveredNodeId === xynode.id) {
          setHoveredNode(null)
        }
      },
      onEdgeMouseEnter: (event, { id, source, target }) => {
        const { hoveredNodeId, focusedNodeId, setHoveredEdge, setHoveredNode } = diagramApi.getState()
        setHoveredEdge(id)
        if ((focusedNodeId === source || focusedNodeId === target) && focusedNodeId !== hoveredNodeId) {
          const next = hoveredNodeFromOnEdgeEnterRef.current = source === focusedNodeId ? target : source
          setHoveredNode(next)
        }
      },
      onEdgeMouseLeave: (event, xyedge) => {
        const { hoveredEdgeId, setHoveredEdge, hoveredNodeId, setHoveredNode } = diagramApi.getState()
        if (hoveredEdgeId === xyedge.id) {
          setHoveredEdge(null)
        }
        if (hoveredNodeId === hoveredNodeFromOnEdgeEnterRef.current) {
          hoveredNodeFromOnEdgeEnterRef.current = ''
          setHoveredNode(null)
        }
      },
      /**
       * Fix viewport transform
       */
      onViewportChange: () => {
        fixViewportTransform()
      }
    }) satisfies XYFlowEventHandlers, [diagramApi, xyflowApi, fixViewportTransform])
}
