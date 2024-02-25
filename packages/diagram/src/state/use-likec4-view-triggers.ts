import { type DiagramNode, invariant } from '@likec4/core'
import { useMemo } from 'react'
import { getUntrackedObject } from 'react-tracked'
import { isNil } from 'remeda'
import { useXYFlow } from '../xyflow/hooks'
import type { XYFlowEdge, XYFlowInstance, XYFlowNode } from '../xyflow/types'
import { useDiagramStateContext } from './state'

export const useLikeC4ViewTriggers = () => {
  const [editor, update] = useDiagramStateContext()
  const xyflow = useXYFlow()
  const eventsRef = getUntrackedObject(editor.eventHandlers)
  invariant(eventsRef, `eventsRef is null`)
  return useMemo(() => {
    return ({
      // onChange: (changeCommand: ChangeCommand) => {
      //   eventsRef.current.onChange?.(changeCommand)
      // },
      onNavigateTo: (element: DiagramNode, event: React.MouseEvent) => {
        const callback = eventsRef.current.onNavigateTo
        const xynode = xyflow.getNode(element.id)
        if (!isNil(element.navigateTo) && xynode && callback) {
          callback({
            element: {
              ...element,
              navigateTo: element.navigateTo
            },
            xynode,
            event
          })
        }
      },

      onNodeClick: (xynode: XYFlowNode, event: React.MouseEvent) => {
        eventsRef.current.onNodeClick?.({
          element: xynode.data.element,
          xynode,
          event
        })
      },

      onEdgeClick: (xyedge: XYFlowEdge, event: React.MouseEvent) => {
        eventsRef.current.onEdgeClick?.({
          relation: xyedge.data.edge,
          xyedge,
          event
        })
      },

      onNodeContextMenu: (xynode: XYFlowNode, event: React.MouseEvent) => {
        eventsRef.current.onNodeContextMenu?.({
          element: xynode.data.element,
          xynode,
          event
        })
      },

      onCanvasDblClick: (event: React.MouseEvent) => {
        eventsRef.current.onCanvasDblClick?.(event)
      },

      onInitialized: (xyflow: XYFlowInstance) => {
        update({
          xyflow,
          viewportInitialized: xyflow.viewportInitialized
        })
        eventsRef.current.onInitialized?.(xyflow)
      }
    })
  }, [eventsRef, update])
}
