import { hasAtLeast, invariant } from '@likec4/core'
import { useSyncedRef } from '@react-hookz/web'
import type { EdgeMouseHandler, NodeMouseHandler, OnNodeDrag } from '@xyflow/react'
import type React from 'react'
import { createContext, type PropsWithChildren, useContext, useRef } from 'react'
import { type Change, type DiagramNodeWithNavigate, type LikeC4DiagramEventHandlers } from '../LikeC4Diagram.props'
import { useXYFlow } from './hooks'
import type { XYFlowEdge, XYFlowNode } from './types'

type XYFlowEventHandlers = {
  onNavigateTo: (xynodeId: string, event: React.MouseEvent) => void
  onPanelClick: (event: React.MouseEvent) => void
  onNodeContextMenu: NodeMouseHandler<XYFlowNode>
  onEdgeContextMenu: EdgeMouseHandler<XYFlowEdge>
  onPaneContextMenu: (event: React.MouseEvent | MouseEvent) => void
  onNodeClick: NodeMouseHandler<XYFlowNode>
  onEdgeClick: EdgeMouseHandler<XYFlowEdge>
  onChange: (change: Change) => void
}

const EventHandlersContext = /* @__PURE__ */ createContext({} as XYFlowEventHandlers)

export const useXYFlowEvents = () => useContext(EventHandlersContext)

type Props = PropsWithChildren<{ eventHandlers: LikeC4DiagramEventHandlers }>
/**
 * Bridge between ReactFlow and LikeC4Diagram event handlers
 */
export function XYFlowEventHandlers({
  children,
  eventHandlers
}: Props) {
  // store the original event handlers in a ref
  const originalsRef = useRef(eventHandlers)
  originalsRef.current = eventHandlers

  const xyflowRef = useSyncedRef(useXYFlow())

  const dblclickTimeout = useRef<number>()
  const xyFlowEventsRef = useRef<XYFlowEventHandlers>()
  xyFlowEventsRef.current ??= {
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
    }
  }
  return (
    <EventHandlersContext.Provider value={xyFlowEventsRef.current}>
      {children}
    </EventHandlersContext.Provider>
  )
}
