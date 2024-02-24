import { useMantineColorScheme } from '@mantine/core'
import { useShallowEffect } from '@mantine/hooks'
import { isEqual } from '@react-hookz/deep-equal'
import { useSyncedRef } from '@react-hookz/web'
import { useRef } from 'react'
import { createContainer } from 'react-tracked'
import { useSetState, useUpdateEffect } from '../hooks'
import type { LikeC4ViewColorMode, LikeC4ViewProps } from '../props'
import { type XYFlowInstance } from '../xyflow/types'

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
    xyflow: null as null | XYFlowInstance,
    viewportInitialized: false
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

  const viewportInitialized = state.xyflow?.viewportInitialized ?? false
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
      nodesDraggable,
      viewportInitialized
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
    nodesDraggable,
    viewportInitialized
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
