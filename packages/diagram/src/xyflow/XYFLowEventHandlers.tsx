import { invariant } from '@likec4/core'
import { useSyncedRef } from '@react-hookz/web'
import { createContext, type PropsWithChildren, useContext, useRef } from 'react'
import type React from 'react'
import type { Exact } from 'type-fest'
import {
  type DiagramNodeWithNavigate,
  isOnlyEventHandlers,
  type LikeC4DiagramEventHandlers
} from '../LikeC4Diagram.props'
import { useXYFlow } from './hooks'
import type { XYFlowEdge, XYFlowNode } from './types'

type XYFLowEventHandlersProps = PropsWithChildren<{ eventHandlers: LikeC4DiagramEventHandlers }>

type XYFLowEventHandlers = {
  onNavigateTo: (xynodeId: string, event: React.MouseEvent) => void
  onPanelClick: (event: React.MouseEvent) => void
  onNodeContextMenu: (event: React.MouseEvent, xynode: XYFlowNode) => void
  onEdgeContextMenu: (event: React.MouseEvent, xyedge: XYFlowEdge) => void
  onPaneContextMenu: (event: React.MouseEvent | MouseEvent) => void
  onNodeClick: (event: React.MouseEvent, xynode: XYFlowNode) => void
  onEdgeClick: (event: React.MouseEvent, xyedge: XYFlowEdge) => void
}

const EventHandlersContext = createContext({} as XYFLowEventHandlers)

export const useXYFLowEventHandlers = () => useContext(EventHandlersContext)

/**
 * Bridge between ReactFlow and LikeC4Diagram event handlers
 */
export function XYFLowEventHandlers({
  children,
  eventHandlers
}: XYFLowEventHandlersProps) {
  const eventHandlersRef = useRef(eventHandlers)
  eventHandlersRef.current = eventHandlers

  const xyflowRef = useSyncedRef(useXYFlow())

  const dblclickTimeout = useRef<number>()
  const xyFlowEventHandlersRef = useRef<XYFLowEventHandlers>()
  if (!xyFlowEventHandlersRef.current) {
    xyFlowEventHandlersRef.current = {
      onPanelClick: (event) => {
        if (!eventHandlersRef.current.onCanvasDblClick) {
          eventHandlersRef.current.onCanvasClick?.(event)
          return
        }

        if (dblclickTimeout.current) {
          window.clearTimeout(dblclickTimeout.current)
          dblclickTimeout.current = undefined
          eventHandlersRef.current.onCanvasDblClick(event)
          return
        }

        dblclickTimeout.current = window.setTimeout(() => {
          dblclickTimeout.current = undefined
          eventHandlersRef.current.onCanvasClick?.(event)
        }, 300)
      },
      onNodeContextMenu: (event, xynode) => {
        eventHandlersRef.current.onNodeContextMenu?.({
          element: xynode.data.element,
          xynode,
          event
        })
      },
      onPaneContextMenu: (event) => {
        eventHandlersRef.current.onCanvasContextMenu?.(event as any)
      },
      onEdgeContextMenu: (event, xyedge) => {
        eventHandlersRef.current.onEdgeContextMenu?.({
          relation: xyedge.data.edge,
          xyedge,
          event
        })
      },
      onNodeClick(event, xynode) {
        eventHandlersRef.current.onNodeClick?.({
          element: xynode.data.element,
          xynode,
          event
        })
      },
      onEdgeClick(event, xyedge) {
        eventHandlersRef.current.onEdgeClick?.({
          relation: xyedge.data.edge,
          xyedge,
          event
        })
      },
      onNavigateTo(xynodeId, event) {
        if (!eventHandlersRef.current.onNavigateTo) {
          return
        }
        const xynode = xyflowRef.current.getNode(xynodeId)
        invariant(xynode, `node not found: ${xynodeId}`)
        const navigateTo = xynode.data.element.navigateTo
        invariant(navigateTo, `node is not navigable: ${xynodeId}`)
        eventHandlersRef.current.onNavigateTo({
          element: xynode.data.element as DiagramNodeWithNavigate,
          xynode,
          event
        })
      }
    }
  }
  return (
    <EventHandlersContext.Provider value={xyFlowEventHandlersRef.current}>
      {children}
    </EventHandlersContext.Provider>
  )
}
