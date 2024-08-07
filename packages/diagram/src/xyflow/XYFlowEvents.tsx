import { extractStep } from '@likec4/core'
import type { ReactFlowProps } from '@xyflow/react'
import { useMemo, useRef } from 'react'
import { isNonNullish, isTruthy } from 'remeda'
import type { Simplify } from 'type-fest'
import { useDiagramStoreApi } from '../state/useDiagramStore'
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
      }, 250)
      return false
    }

    const lastClickWasRecent = (ms = 1500) => {
      return lastClickTimestamp.current && (Date.now() - lastClickTimestamp.current) < ms
    }

    return ({
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
        if (dbclickLock()) {
          return
        }
        const {
          focusedNodeId,
          activeDynamicViewStep,
          fitDiagram,
          onCanvasClick,
          resetLastClicked
        } = diagramApi.getState()
        if ((focusedNodeId ?? activeDynamicViewStep) !== null) {
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
          edge: xyedge.data.edge,
          xyedge,
          event
        })
      },
      onNodeClick: (event, xynode) => {
        const {
          focusedNodeId,
          fitDiagram,
          focusOnNode,
          onNodeClick,
          enableFocusMode,
          lastClickedNodeId,
          setLastClickedNode
        } = diagramApi.getState()
        setLastClickedNode(xynode.id)
        // if we focused on a node, and clicked on another node - focus on the clicked node
        const shallChangeFocus = !!focusedNodeId && focusedNodeId !== xynode.id
        // if user clicked on the same node twice in a short time, focus on it
        const clickedRecently = lastClickedNodeId === xynode.id && lastClickWasRecent()
        if (enableFocusMode) {
          let stopPropagation = false
          switch (true) {
            case !focusedNodeId && clickedRecently:
            case shallChangeFocus:
              stopPropagation = true
              focusOnNode(xynode.id)
              break
            case focusedNodeId === xynode.id && clickedRecently:
              stopPropagation = true
              fitDiagram()
              break
          }
          if (!onNodeClick && stopPropagation) {
            // user did not provide a custom handler, stop propagation
            event.stopPropagation()
          }
        }
        lastClickTimestamp.current = Date.now()
        onNodeClick?.({
          element: xynode.data.element,
          xynode,
          event
        })
      },
      onNodeDoubleClick: (event, xynode) => {
        const {
          focusedNodeId,
          enableFocusMode,
          fitDiagram,
          focusOnNode,
          setLastClickedNode
        } = diagramApi.getState()
        setLastClickedNode(xynode.id)
        lastClickTimestamp.current = Date.now()
        if (isNonNullish(focusedNodeId) || enableFocusMode) {
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
        const {
          lastClickedEdgeId,
          isDynamicView,
          enableDynamicViewWalkthrough,
          activateDynamicStep,
          activeDynamicViewStep,
          focusedNodeId,
          focusOnNode,
          onEdgeClick,
          setLastClickedEdge
        } = diagramApi.getState()
        if (lastClickedEdgeId !== xyedge.id) {
          setLastClickedEdge(xyedge.id)
        }
        const isNotAFirstClick = lastClickedEdgeId === xyedge.id
        const isEdgeOfFocusedNode = isTruthy(focusedNodeId)
          && (focusedNodeId === xyedge.source || focusedNodeId === xyedge.target)
        if (
          isDynamicView && enableDynamicViewWalkthrough
          && (isEdgeOfFocusedNode || isNotAFirstClick || isNonNullish(activeDynamicViewStep))
        ) {
          const nextStep = extractStep(xyedge.data.edge.id)
          if (activeDynamicViewStep !== nextStep) {
            activateDynamicStep(nextStep)
            event.stopPropagation()
            return
          }
        }
        // if we focused on a node, and clicked on an edge connected to it - focus on the other node
        if (isEdgeOfFocusedNode) {
          focusOnNode(focusedNodeId === xyedge.source ? xyedge.target : xyedge.source)
          if (!onEdgeClick) {
            // user did not provide a custom handler, stop propagation
            event.stopPropagation()
          }
        }
        onEdgeClick?.({
          edge: xyedge.data.edge,
          xyedge,
          event
        })
      },
      onEdgeDoubleClick: (event, xyedge) => {
        diagramApi.getState().setLastClickedEdge(xyedge.id)
        const {
          enableFocusMode,
          isDynamicView,
          enableDynamicViewWalkthrough,
          focusOnNode,
          activateDynamicStep,
          activeDynamicViewStep
        } = diagramApi.getState()
        // if we are in dynamic view, and clicked on an edge, activate the step
        if (isDynamicView && enableDynamicViewWalkthrough) {
          const nextStep = extractStep(xyedge.data.edge.id)
          if (activeDynamicViewStep !== nextStep) {
            activateDynamicStep(extractStep(xyedge.data.edge.id))
            event.stopPropagation()
          }
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
