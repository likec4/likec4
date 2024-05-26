import type { ReactFlowProps } from '@xyflow/react'
import { useEffect, useMemo, useRef } from 'react'
import type { Simplify } from 'type-fest'
import { useDiagramStoreApi } from '../state'
import { useXYStoreApi } from './hooks'
import type { XYFlowEdge, XYFlowNode, XYFlowState } from './types'

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

const viewportDomNode = (state: XYFlowState) =>
  state.domNode?.querySelector<HTMLDivElement>('.react-flow__viewport') ?? null

export function useXYFlowEvents() {
  const diagramApi = useDiagramStoreApi()
  const xyflowApi = useXYStoreApi()

  const dblclickTimeout = useRef<number>()

  const viewportRef = useRef(viewportDomNode(xyflowApi.getState()))

  const dbclickGuarg = () => {
    if (dblclickTimeout.current !== undefined) {
      return true
    }
    dblclickTimeout.current = window.setTimeout(() => {
      dblclickTimeout.current = undefined
    }, 250)
    return false
  }

  const transformRef = useRef('')
  const cbRef = useRef<number>()

  useEffect(() =>
    xyflowApi.subscribe((state, prev) => {
      if (state.domNode !== prev.domNode || (state.domNode && !viewportRef.current)) {
        viewportRef.current = viewportDomNode(state)
      }
    }), [xyflowApi])

  return useMemo(() =>
    ({
      onDoubleClick: (event) => {
        diagramApi.getState().resetLastClicked()
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
        const { focusedNodeId, fitDiagram, onCanvasClick, resetLastClicked } = diagramApi.getState()
        resetLastClicked()
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
        diagramApi.getState().setLastClickedNode(xynode.id)
        const { zoomable, fitViewEnabled, fitDiagram, onNodeClick } = diagramApi.getState()
        if (onNodeClick) {
          return
        }
        if (zoomable && fitViewEnabled) {
          fitDiagram(xynode)
          event.stopPropagation()
        }
      },
      onEdgeClick: (event, xyedge) => {
        diagramApi.getState().setLastClickedEdge(xyedge.id)
        const { focusedNodeId, fitDiagram, onEdgeClick, xyflow } = diagramApi.getState()
        if (onEdgeClick) {
          onEdgeClick({
            relation: xyedge.data.edge,
            xyedge,
            event
          })
          return
        }
        if (focusedNodeId && (focusedNodeId === xyedge.source || focusedNodeId === xyedge.target)) {
          const nextFocus = focusedNodeId === xyedge.source ? xyedge.target : xyedge.source
          fitDiagram(xyflow.getNode(nextFocus))
          event.stopPropagation()
        }
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
      },
      /**
       * WOKAROUND:
       * Viewport transform is not rounded to integers which results in blurry nodes on some resolution
       * https://github.com/xyflow/xyflow/issues/3282
       */
      onViewportChange: ({ x, y, zoom }) => {
        const scale = zoom != 1 ? zoom.toFixed(6) : '1'
        transformRef.current = `translate(${Math.round(x)}px, ${Math.round(y)}px) scale(${scale})`
        cbRef.current ??= requestIdleCallback(() => {
          cbRef.current = undefined
          if (viewportRef.current && viewportRef.current.style.transform !== transformRef.current) {
            viewportRef.current.style.transform = transformRef.current
          }
        }, {
          timeout: 1000
        })
      }
    }) satisfies XYFlowEventHandlers, [diagramApi, xyflowApi])
}
