import { hasAtLeast, invariant, nonNullable } from '@likec4/core'
import { useSyncedRef } from '@react-hookz/web'
import type { EdgeMouseHandler, NodeMouseHandler, OnMoveEnd, OnMoveStart, OnNodeDrag, Viewport } from '@xyflow/react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { createContext, type PropsWithChildren, useContext, useMemo, useRef, useState } from 'react'
import { type Change, type DiagramNodeWithNavigate, type LikeC4DiagramEventHandlers } from '../LikeC4Diagram.props'
import { useUpdateDiagramState } from '../state'
import { useDiagramStoreApi } from '../store'
import { useXYFlow, useXYStoreApi } from './hooks'
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
      // if (!!event && viewportOnMoveStart.current) {
      //   diagramApi.setState({ viewportMoved: true })
      // }
      viewportOnMoveStart.current = undefined
    }
  }), [diagramApi, xyflowApi])
}

// type Props = PropsWithChildren<{ eventHandlers: LikeC4DiagramEventHandlers }>
// /**
//  * Bridge between ReactFlow and LikeC4Diagram event handlers
//  */
// export function XYFlowEventHandlers({
//   children,
//   eventHandlers
// }: Props) {
//   console.log('XYFlowEventHandlers')
//   const updateState = useUpdateDiagramState()
//   // store the original event handlers in a ref
//   const originalsRef = useRef(eventHandlers)
//   diagramState = eventHandlers

//   const xystoreApi = useXYStoreApi()

//   const dblclickTimeout = useRef<number>()

//   const viewportOnMoveStart = useRef<Viewport>()

//   const xyFlowEvents = useMemo<XYFlowEventHandlers>(() => ({
//     onPanelClick: (event) => {
//       if (!diagramState.onCanvasDblClick) {
//         diagramState.onCanvasClick?.(event)
//         return
//       }

//       if (dblclickTimeout.current) {
//         window.clearTimeout(dblclickTimeout.current)
//         dblclickTimeout.current = undefined
//         diagramState.onCanvasDblClick(event)
//         return
//       }

//       dblclickTimeout.current = window.setTimeout(() => {
//         dblclickTimeout.current = undefined
//         diagramState.onCanvasClick?.(event)
//       }, 300)
//     },
//     onNodeContextMenu: (event, xynode) => {
//       diagramState.onNodeContextMenu?.({
//         element: xynode.data.element,
//         xynode,
//         event
//       })
//     },
//     onPaneContextMenu: (event) => {
//       diagramState.onCanvasContextMenu?.(event as any)
//     },
//     onEdgeContextMenu: (event, xyedge) => {
//       diagramState.onEdgeContextMenu?.({
//         relation: xyedge.data.edge,
//         xyedge,
//         event
//       })
//     },
//     onNodeClick: (event, xynode) => {
//       diagramState.onNodeClick?.({
//         element: xynode.data.element,
//         xynode,
//         event
//       })
//     },
//     onEdgeClick: (event, xyedge) => {
//       diagramState.onEdgeClick?.({
//         relation: xyedge.data.edge,
//         xyedge,
//         event
//       })
//     },
//     onNavigateTo: (xynodeId, event) => {
//       if (!diagramState.onNavigateTo) {
//         return
//       }
//       const xynode = xyflowRef.current.getNode(xynodeId)
//       invariant(xynode, `node not found: ${xynodeId}`)
//       const navigateTo = xynode.data.element.navigateTo
//       invariant(navigateTo, `node is not navigable: ${xynodeId}`)
//       diagramState.onNavigateTo({
//         element: xynode.data.element as DiagramNodeWithNavigate,
//         xynode,
//         event
//       })
//     },
//     onChange: (change: Change | Change[]) => {
//       const changes = Array.isArray(change) ? change : [change]
//       invariant(hasAtLeast(changes, 1), 'no changes')
//       diagramState.onChange?.({ changes })
//     },
//     onMoveStart: (_event, viewport) => {
//       viewportOnMoveStart.current = viewport
//     },
//     onMoveEnd: (event, _viewport) => {
//       if (!!event && viewportOnMoveStart.current) {
//         updateState({ viewportMoved: true })
//       }
//       viewportOnMoveStart.current = undefined
//     }
//   }), [xystoreApi])
//   return (
//     <EventHandlersContext.Provider value={xyFlowEvents}>
//       {children}
//     </EventHandlersContext.Provider>
//   )
// }
