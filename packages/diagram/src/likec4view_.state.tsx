import { type DiagramNode, invariant } from '@likec4/core'
import { useMantineColorScheme } from '@mantine/core'
import { useShallowEffect } from '@mantine/hooks'
import { isEqual } from '@react-hookz/deep-equal'
import { useSyncedRef } from '@react-hookz/web'
import { useMemo, useRef } from 'react'
import { createContainer, getUntrackedObject } from 'react-tracked'
import { isNil } from 'remeda'
import { useSetState, useUpdateEffect, useXYFlow } from './hooks'
import type { LikeC4ViewColorMode, LikeC4ViewProps } from './likec4view_.types'
import { type XYFlowEdge, type XYFlowInstance, XYFlowNode } from './likec4view_.xyflow-types'

const useLikeC4ViewState_ReactTracked = ({
  view,
  // colorMode = 'system',
  readonly = false,
  pannable = true,
  zoomable = true,
  controls = !readonly,
  nodesSelectable = !readonly,
  nodesDraggable = !readonly,
  disableBackground = false,
  fitViewPadding = 0.05,
  ...eventHandlers
}: LikeC4ViewProps) => {
  const eventsRef = useSyncedRef(eventHandlers)

  const hasEventHandlers = {
    hasOnNavigateTo: !!eventHandlers.onNavigateTo,
    hasOnNodeClick: !!eventHandlers.onNodeClick,
    hasOnNodeContextMenu: !!eventHandlers.onNodeContextMenu,
    hasOnEdgeClick: !!eventHandlers.onEdgeClick,
    hasOnCanvasClick: !!eventHandlers.onCanvasClick || !!eventHandlers.onCanvasDblClick
  }

  const xyflowRef = useRef<XYFlowInstance | null>(null)

  const { colorScheme } = useMantineColorScheme()
  const colorMode: LikeC4ViewColorMode = colorScheme

  const [state, setState] = useSetState({
    viewId: view.id,
    view,
    viewNodes: view.nodes,
    viewEdges: view.edges,
    hoveredEdgeId: null as null | string,
    eventHandlers: eventsRef,
    disableBackground,
    fitViewPadding,
    colorMode,
    controls,
    pannable,
    zoomable,
    readonly,
    nodesSelectable,
    nodesDraggable,
    ...hasEventHandlers,
    xyflow: null as null | XYFlowInstance
  })

  xyflowRef.current = state.xyflow

  useUpdateEffect(() => {
    setState({
      eventHandlers: eventsRef
    })
  }, [eventsRef])

  useShallowEffect(() => {
    setState({
      ...hasEventHandlers
    })
  }, [hasEventHandlers])

  const viewId = view.id
  useUpdateEffect(() => {
    setState({ viewId })
  }, [viewId])

  useUpdateEffect(() => {
    setState(({ viewNodes, viewEdges }) => ({
      viewNodes: isEqual(viewNodes, view.nodes) ? viewNodes : view.nodes,
      viewEdges: isEqual(viewEdges, view.edges) ? viewEdges : view.edges,
      view
    }))
  }, [view])

  useUpdateEffect(() => {
    setState({
      fitViewPadding,
      colorMode,
      controls,
      pannable,
      zoomable,
      readonly,
      disableBackground,
      nodesSelectable,
      nodesDraggable
    })
  }, [
    fitViewPadding,
    colorMode,
    controls,
    pannable,
    zoomable,
    readonly,
    disableBackground,
    nodesSelectable,
    nodesDraggable
  ])

  return [state, setState] as const
}

export const {
  Provider: LikeC4ViewStateProvider,
  useTracked: useLikeC4View,
  useTrackedState: useLikeC4ViewState,
  useUpdate: useLikeC4ViewUpdate,
  useSelector: useLikeC4ViewSelector
} = createContainer(useLikeC4ViewState_ReactTracked)

export const useLikeC4ViewTriggers = () => {
  const [editor, update] = useLikeC4View()
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
        update({ xyflow })
        eventsRef.current.onInitialized?.(xyflow)
      }
    })
  }, [eventsRef, update])
}
