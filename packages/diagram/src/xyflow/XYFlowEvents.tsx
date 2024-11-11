import type { ReactFlowProps } from '@xyflow/react'
import { useMemo, useRef } from 'react'
import { isNonNullish, isTruthy } from 'remeda'
import type { Simplify } from 'type-fest'
import { useDiagramStoreApi } from '../hooks/useDiagramState'
import type { XYFlowEdge, XYFlowNode } from './types'

export type XYFlowEventHandlers = Simplify<
  Required<
    Pick<
      ReactFlowProps<XYFlowNode, XYFlowEdge>,
      | 'onDoubleClick'
      | 'onPaneClick'
      | 'onNodeClick'
      | 'onNodeDoubleClick'
      | 'onEdgeClick'
      | 'onEdgeDoubleClick'
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

  const lastClickTimestamp = useRef<number>()

  const dblclickTimeout = useRef<number>()

  // If we are in focused mode, on edge enter we want to "highlight" the other node
  // This ref contains the id of this node
  const hoveredNodeFromOnEdgeEnterRef = useRef('')

  return useMemo(() => {
    const dbclickLock = () => {
      if (dblclickTimeout.current !== undefined) {
        return true
      }
      dblclickTimeout.current = window.setTimeout(() => {
        dblclickTimeout.current = undefined
      }, 300)
      return false
    }

    const lastClickWasRecent = (ms = 2000) => {
      const prevTimestamp = lastClickTimestamp.current ?? 0
      const now = lastClickTimestamp.current = Date.now()
      return prevTimestamp + ms > now
    }

    return ({
      onDoubleClick: (event) => {
        const {
          onCanvasDblClick,
          zoomable,
          viewportChanged,
          fitDiagram,
          resetFocusAndLastClicked
        } = diagramApi.getState()
        resetFocusAndLastClicked()
        if (zoomable && viewportChanged) {
          fitDiagram()
        }
        if (!onCanvasDblClick) {
          event.stopPropagation()
        }
        onCanvasDblClick?.(event)
      },
      onPaneClick: (event) => {
        if (dbclickLock()) {
          return
        }
        const {
          focusedNodeId,
          activeWalkthrough,
          fitDiagram,
          onCanvasClick,
          resetFocusAndLastClicked
        } = diagramApi.getState()
        if ((focusedNodeId ?? activeWalkthrough) !== null) {
          fitDiagram()
          if (!onCanvasClick) {
            event.stopPropagation()
          }
        }
        resetFocusAndLastClicked()
        onCanvasClick?.(event)
      },
      onNodeContextMenu: (event, xynode) => {
        diagramApi.getState().setLastClickedNode(xynode.id)
        diagramApi.getState().onNodeContextMenu?.(
          xynode.data.element,
          event
        )
      },
      onPaneContextMenu: (event) => {
        diagramApi.getState().resetFocusAndLastClicked()
        diagramApi.getState().onCanvasContextMenu?.(event as any)
      },
      onEdgeContextMenu: (event, xyedge) => {
        diagramApi.getState().setLastClickedEdge(xyedge.id)
        diagramApi.getState().onEdgeContextMenu?.(
          xyedge.data.edge,
          event
        )
      },
      onNodeClick: (event, xynode) => {
        const {
          focusedNodeId,
          fitDiagram,
          focusOnNode,
          onNodeClick,
          xystore,
          enableFocusMode,
          lastClickedNodeId,
          nodesSelectable,
          enableElementDetails,
          setLastClickedNode,
          onOpenSourceElement,
          openOverlay
        } = diagramApi.getState()
        setLastClickedNode(xynode.id)
        // if we focused on a node, and clicked on another node - focus on the clicked node
        const shallChangeFocus = !!focusedNodeId && focusedNodeId !== xynode.id
        // if user clicked on the same node twice in a short time, focus on it
        const clickedRecently = lastClickWasRecent() && lastClickedNodeId === xynode.id

        let stopPropagation = false

        if (clickedRecently && !!onOpenSourceElement) {
          onOpenSourceElement(xynode.data.element.id)
          stopPropagation = true
        }

        if (enableFocusMode) {
          switch (true) {
            case shallChangeFocus || (clickedRecently && !focusedNodeId): {
              focusOnNode(xynode.id)
              stopPropagation = true
              break
            }
            case clickedRecently && focusedNodeId === xynode.id && enableElementDetails: {
              openOverlay({
                elementDetails: xynode.data.element.id
              })
              // reset clickedRecently
              setLastClickedNode(null)
              stopPropagation = true
              break
            }
            case focusedNodeId === xynode.id: {
              focusOnNode(false)
              fitDiagram()
              stopPropagation = true
              break
            }
          }
        } else if (nodesSelectable) {
          xystore.getState().addSelectedNodes([xynode.id])
          stopPropagation = true
        }

        if (!onNodeClick && stopPropagation) {
          event.stopPropagation()
          return
        }

        onNodeClick?.(
          xynode.data.element,
          event
        )
      },
      onNodeDoubleClick: (event, xynode) => {
        const {
          setLastClickedNode
        } = diagramApi.getState()
        setLastClickedNode(xynode.id)
        lastClickWasRecent()
        event.stopPropagation()
      },
      onEdgeClick: (event, xyedge) => {
        const {
          lastClickedEdgeId,
          isDynamicView,
          enableDynamicViewWalkthrough,
          activateWalkthrough,
          activeWalkthrough,
          focusedNodeId,
          xystore,
          nodesSelectable,
          focusOnNode,
          onEdgeClick,
          setLastClickedEdge
        } = diagramApi.getState()
        if (lastClickedEdgeId !== xyedge.id) {
          setLastClickedEdge(xyedge.id)
        }
        const isNotAFirstClick = lastClickedEdgeId === xyedge.id
        const connectedToFocusedNode = isTruthy(focusedNodeId)
          && (focusedNodeId === xyedge.source || focusedNodeId === xyedge.target)
        if (
          isDynamicView && enableDynamicViewWalkthrough
          && (connectedToFocusedNode || isNotAFirstClick || isNonNullish(activeWalkthrough))
        ) {
          const nextStep = xyedge.data.edge.id
          if (activeWalkthrough?.stepId !== nextStep) {
            activateWalkthrough(nextStep)
            event.stopPropagation()
            return
          }
        }
        // if we are in focus mode
        if (isTruthy(focusedNodeId)) {
          // if we focused on a node, and clicked on an edge connected to it - focus on the other node
          if (connectedToFocusedNode) {
            focusOnNode(focusedNodeId === xyedge.source ? xyedge.target : xyedge.source)
          } else {
            focusOnNode(xyedge.source)
          }
          if (!onEdgeClick) {
            event.stopPropagation()
            return
          }
        } else if (nodesSelectable) {
          xystore.getState().addSelectedEdges([xyedge.id])
          if (!onEdgeClick) {
            event.stopPropagation()
            return
          }
        }
        onEdgeClick?.(
          xyedge.data.edge,
          event
        )
      },
      onEdgeDoubleClick: (event, xyedge) => {
        diagramApi.getState().setLastClickedEdge(xyedge.id)
        const {
          enableFocusMode,
          isDynamicView,
          enableDynamicViewWalkthrough,
          focusOnNode,
          activeWalkthrough,
          activateWalkthrough,
          openOverlay,
          showRelationshipDetails
        } = diagramApi.getState()
        // if we are in dynamic view, and clicked on an edge, activate the step
        if (isDynamicView && enableDynamicViewWalkthrough) {
          const nextStep = xyedge.data.edge.id
          if (activeWalkthrough?.stepId !== nextStep) {
            activateWalkthrough(nextStep)
            event.stopPropagation()
          }
          return
        }

        if (showRelationshipDetails) {
          openOverlay({
            edgeDetails: xyedge.data.edge.id
          })
          event.stopPropagation()
          return
        }

        if (enableFocusMode) {
          focusOnNode(xyedge.source)
          event.stopPropagation()
          return
        }
      },
      onMoveEnd: (event, _viewport) => {
        // if event is present, the move was triggered by user
        const viewportChanged = !!event
        if (viewportChanged !== diagramApi.getState().viewportChanged) {
          diagramApi.setState({ viewportChanged }, false, `viewport-changed: ${viewportChanged}`)
        }
      },
      onNodeMouseEnter: (_event, xynode) => {
        hoveredNodeFromOnEdgeEnterRef.current = ''
        diagramApi.getState().setHoveredNode(xynode.id)
      },
      onNodeMouseLeave: (_event, xynode) => {
        const { hoveredNodeId, setHoveredNode } = diagramApi.getState()
        if (hoveredNodeId === xynode.id) {
          setHoveredNode(null)
        }
      },
      onEdgeMouseEnter: (_event, { id, source, target }) => {
        const { hoveredNodeId, focusedNodeId, setHoveredEdge, setHoveredNode } = diagramApi.getState()
        setHoveredEdge(id)
        if ((focusedNodeId === source || focusedNodeId === target) && focusedNodeId !== hoveredNodeId) {
          const next = hoveredNodeFromOnEdgeEnterRef.current = source === focusedNodeId ? target : source
          setHoveredNode(next)
        }
      },
      onEdgeMouseLeave: (_event, xyedge) => {
        const { hoveredEdgeId, setHoveredEdge, hoveredNodeId, setHoveredNode } = diagramApi.getState()
        if (hoveredEdgeId === xyedge.id) {
          setHoveredEdge(null)
        }
        if (hoveredNodeId === hoveredNodeFromOnEdgeEnterRef.current) {
          setHoveredNode(null)
        }
        hoveredNodeFromOnEdgeEnterRef.current = ''
      }
    }) satisfies XYFlowEventHandlers
  }, [diagramApi])
}
