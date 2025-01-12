import { DiagramNode } from '@likec4/core'
import type { ReactFlowProps } from '@xyflow/react'
import { useMemo, useRef } from 'react'
import { first, isNonNullish, isTruthy } from 'remeda'
import type { Simplify } from 'type-fest'
import { useDiagramStoreApi } from '../hooks/useDiagramState'
import type { DiagramFlowTypes } from './types'

export type XYFlowEventHandlers = Simplify<
  Required<
    Pick<
      ReactFlowProps<DiagramFlowTypes.Node, DiagramFlowTypes.Edge>,
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
      | 'onEdgeMouseEnter'
      | 'onEdgeMouseLeave'
    >
  >
>

export function useXYFlowEvents() {
  const diagramApi = useDiagramStoreApi()

  const lastClickTimestamp = useRef<number>(undefined)

  const dblclickTimeout = useRef<number>(undefined)

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
          resetFocusAndLastClicked,
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
          resetFocusAndLastClicked,
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
          event,
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
          event,
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
          onOpenSource,
          openOverlay,
        } = diagramApi.getState()
        const modelRef = DiagramNode.modelRef(xynode.data.element)
        const deploymentRef = DiagramNode.deploymentRef(xynode.data.element)
        setLastClickedNode(xynode.id)
        // if we focused on a node, and clicked on another node - focus on the clicked node
        const shallChangeFocus = !!focusedNodeId && focusedNodeId !== xynode.id
        // if user clicked on the same node twice in a short time, focus on it
        const clickedRecently = lastClickWasRecent() && lastClickedNodeId === xynode.id

        let stopPropagation = false

        if (clickedRecently && !!onOpenSource && (modelRef || deploymentRef)) {
          if (modelRef) {
            onOpenSource({
              element: modelRef,
            })
          } else if (deploymentRef) {
            onOpenSource({
              deployment: deploymentRef,
            })
          }
          stopPropagation = true
        }

        if (enableFocusMode) {
          switch (true) {
            case shallChangeFocus || (clickedRecently && !focusedNodeId): {
              focusOnNode(xynode.id)
              stopPropagation = true
              break
            }
            case clickedRecently && focusedNodeId === xynode.id: {
              focusOnNode(false)
              fitDiagram()
              stopPropagation = true
              break
            }
            case !clickedRecently && modelRef && focusedNodeId === xynode.id && enableElementDetails: {
              openOverlay({
                elementDetails: xynode.data.element.id,
              })
              stopPropagation = true
              break
            }
          }
        } else if (
          enableElementDetails && modelRef && (clickedRecently || focusedNodeId === xynode.id) && !onNodeClick
        ) {
          openOverlay({
            elementDetails: xynode.data.element.id,
          })
          stopPropagation = true
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
          event,
        )
      },
      onNodeDoubleClick: (event, xynode) => {
        const {
          setLastClickedNode,
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
          onOpenSource,
          focusOnNode,
          onEdgeClick,
          setLastClickedEdge,
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
        } else if (onOpenSource && !onEdgeClick) {
          onOpenSource({
            relation: first(xyedge.data.edge.relations)!,
          })
          event.stopPropagation()
          return
        } else if (nodesSelectable) {
          xystore.getState().addSelectedEdges([xyedge.id])
          if (!onEdgeClick) {
            event.stopPropagation()
            return
          }
        }
        onEdgeClick?.(
          xyedge.data.edge,
          event,
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
          enableRelationshipDetails,
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

        if (enableRelationshipDetails) {
          openOverlay({
            edgeDetails: xyedge.data.edge.id,
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
      onEdgeMouseEnter: (_event, { id }) => {
        const { setHoveredEdge } = diagramApi.getState()
        setHoveredEdge(id)
      },
      onEdgeMouseLeave: (_event, xyedge) => {
        const { hoveredEdgeId, setHoveredEdge } = diagramApi.getState()
        if (hoveredEdgeId === xyedge.id) {
          setHoveredEdge(null)
        }
      },
    }) satisfies XYFlowEventHandlers
  }, [diagramApi])
}
