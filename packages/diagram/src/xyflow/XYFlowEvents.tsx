import { hasAtLeast, invariant, nonNullable } from '@likec4/core'
import { useSyncedRef } from '@react-hookz/web'
import type { EdgeMouseHandler, NodeMouseHandler, OnMoveEnd, OnMoveStart, OnNodeDrag, Viewport } from '@xyflow/react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { createContext, type PropsWithChildren, useContext, useRef, useState } from 'react'
import { type Change, type DiagramNodeWithNavigate, type LikeC4DiagramEventHandlers } from '../LikeC4Diagram.props'
import { useUpdateDiagramState } from '../state'
import { useXYFlow } from './hooks'
import type { XYFlowEdge, XYFlowNode } from './types'

type XYFlowEventHandlers = {
  onNavigateTo: (xynodeId: string, event: ReactMouseEvent) => void
  onPanelClick: (event: ReactMouseEvent) => void
  onNodeContextMenu: NodeMouseHandler<XYFlowNode>
  onEdgeContextMenu: EdgeMouseHandler<XYFlowEdge>
  onPaneContextMenu: (event: ReactMouseEvent | MouseEvent) => void
  onNodeClick: NodeMouseHandler<XYFlowNode>
  onEdgeClick: EdgeMouseHandler<XYFlowEdge>
  onChange: (change: Change) => void
  onMoveStart: OnMoveStart
  onMoveEnd: OnMoveEnd
}

const EventHandlersContext = createContext<XYFlowEventHandlers | null>(null)

export function useXYFlowEvents() {
  const ctx = useContext(EventHandlersContext)
  return nonNullable(ctx, 'useXYFlowEvents could be used only inside XYFlowEventHandlers')
}

type Props = PropsWithChildren<{ eventHandlers: LikeC4DiagramEventHandlers }>
/**
 * Bridge between ReactFlow and LikeC4Diagram event handlers
 */
export function XYFlowEventHandlers({
  children,
  eventHandlers
}: Props) {
  const updateState = useUpdateDiagramState()
  // store the original event handlers in a ref
  const originalsRef = useRef(eventHandlers)
  originalsRef.current = eventHandlers

  const xyflowRef = useSyncedRef(useXYFlow())

  const dblclickTimeout = useRef<number>()

  const viewportOnMoveStart = useRef<Viewport>()

  const [xyFlowEvents] = useState<XYFlowEventHandlers>(() => ({
    onPanelClick: (event) => {
      if (!originalsRef.current.onCanvasDblClick) {
        originalsRef.current.onCanvasClick?.(event)
        return
      }

      if (dblclickTimeout.current) {
        window.clearTimeout(dblclickTimeout.current)
        dblclickTimeout.current = undefined
        originalsRef.current.onCanvasDblClick(event)
        return
      }

      dblclickTimeout.current = window.setTimeout(() => {
        dblclickTimeout.current = undefined
        originalsRef.current.onCanvasClick?.(event)
      }, 300)
    },
    onNodeContextMenu: (event, xynode) => {
      originalsRef.current.onNodeContextMenu?.({
        element: xynode.data.element,
        xynode,
        event
      })
    },
    onPaneContextMenu: (event) => {
      originalsRef.current.onCanvasContextMenu?.(event as any)
    },
    onEdgeContextMenu: (event, xyedge) => {
      originalsRef.current.onEdgeContextMenu?.({
        relation: xyedge.data.edge,
        xyedge,
        event
      })
    },
    onNodeClick: (event, xynode) => {
      originalsRef.current.onNodeClick?.({
        element: xynode.data.element,
        xynode,
        event
      })
    },
    onEdgeClick: (event, xyedge) => {
      originalsRef.current.onEdgeClick?.({
        relation: xyedge.data.edge,
        xyedge,
        event
      })
    },
    onNavigateTo: (xynodeId, event) => {
      if (!originalsRef.current.onNavigateTo) {
        return
      }
      const xynode = xyflowRef.current.getNode(xynodeId)
      invariant(xynode, `node not found: ${xynodeId}`)
      const navigateTo = xynode.data.element.navigateTo
      invariant(navigateTo, `node is not navigable: ${xynodeId}`)
      originalsRef.current.onNavigateTo({
        element: xynode.data.element as DiagramNodeWithNavigate,
        xynode,
        event
      })
    },
    onChange: (change: Change | Change[]) => {
      const changes = Array.isArray(change) ? change : [change]
      invariant(hasAtLeast(changes, 1), 'no changes')
      originalsRef.current.onChange?.({ changes })
    },
    onMoveStart: (_event, viewport) => {
      viewportOnMoveStart.current = viewport
    },
    onMoveEnd: (event, _viewport) => {
      if (!!event && viewportOnMoveStart.current) {
        updateState({ viewportMoved: true })
      }
      viewportOnMoveStart.current = undefined
    }
  }))
  return (
    <EventHandlersContext.Provider value={xyFlowEvents}>
      {children}
    </EventHandlersContext.Provider>
  )
}
