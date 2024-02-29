import { type DiagramNode, invariant } from '@likec4/core'
import { useMantineColorScheme } from '@mantine/core'
import { useShallowEffect } from '@mantine/hooks'
import { isEqual } from '@react-hookz/deep-equal'
import { useCustomCompareMemo, useSyncedRef } from '@react-hookz/web'
import type { ReactFlowInstance, ReactFlowProps } from '@xyflow/react'
import { shallowEqual } from 'fast-equals'
import { type RefObject, useCallback, useEffect, useMemo, useRef } from 'react'
import { createContainer } from 'react-tracked'
import { isTruthy } from 'remeda'
import type { Exact } from 'type-fest'
import { useSetState, useUpdateEffect } from '../hooks'
import type {
  DiagramNodeWithNavigate,
  LikeC4DiagramEventHandlers,
  LikeC4DiagramProps,
  LikeC4ViewColorMode,
  OnCanvasClick,
  OnEdgeClick,
  OnNodeClick
} from '../props'
import { useXYFlow } from '../xyflow'
import { XYFlowEdge, type XYFlowInstance, XYFlowNode } from '../xyflow/types'

// Ensure that object contains only event handlers
function isOnlyEventHandlers<T extends Exact<LikeC4DiagramEventHandlers, T>>(handlers: T): T {
  return handlers
}

type Handlers = {
  [K in keyof LikeC4DiagramEventHandlers]-?: NonNullable<LikeC4DiagramEventHandlers[K]>
}
function useStableEventHandlers<T extends LikeC4DiagramEventHandlers>(handlers: T): Handlers {
  const eventsRef = useSyncedRef(handlers)
  const handlersRef = useRef<Handlers>()
  if (!handlersRef.current) {
    handlersRef.current = {
      onCanvasClick: (args) => {
        eventsRef.current.onCanvasClick?.(args)
      },
      onCanvasDblClick: (args) => {
        eventsRef.current.onCanvasDblClick?.(args)
      },
      onEdgeClick: (args) => {
        eventsRef.current.onEdgeClick?.(args)
      },
      onNodeClick: (args) => {
        eventsRef.current.onNodeClick?.(args)
      },
      onNodeContextMenu: (args) => {
        eventsRef.current.onNodeContextMenu?.(args)
      },
      onNavigateTo: (args) => {
        eventsRef.current.onNavigateTo?.(args)
      },
      onInitialized: (args) => {
        eventsRef.current.onInitialized?.(args)
      }
    }
  }
  return handlersRef.current
}

const useDiagramState_ReactTracked = ({
  view,
  colorMode: _colorMode = 'auto',
  readonly = false,
  pannable = true,
  zoomable = true,
  controls = !readonly,
  nodesSelectable = !readonly,
  nodesDraggable = !readonly,
  disableBackground = false,
  fitViewPadding = 0.05,
  ...eventHandlers
}: LikeC4DiagramProps) => {
  const hasEventHandlers = {
    hasOnNavigateTo: !!eventHandlers.onNavigateTo,
    hasOnNodeClick: !!eventHandlers.onNodeClick,
    hasOnNodeContextMenu: !!eventHandlers.onNodeContextMenu,
    hasOnEdgeClick: !!eventHandlers.onEdgeClick,
    hasOnCanvasClick: !!eventHandlers.onCanvasClick || !!eventHandlers.onCanvasDblClick
  }

  const xyflow = useXYFlow()

  const { colorScheme } = useMantineColorScheme()
  const colorMode: LikeC4ViewColorMode = _colorMode !== 'auto' ? _colorMode : colorScheme

  const [state, setState] = useSetState({
    viewId: view.id,
    view,
    viewNodes: view.nodes,
    viewEdges: view.edges,
    hoveredEdgeId: null as null | string,
    disableBackground,
    fitViewPadding,
    colorMode,
    controls,
    pannable,
    zoomable,
    readonly,
    nodesSelectable,
    nodesDraggable,
    viewportInitialized: false,
    ...hasEventHandlers
  })

  useShallowEffect(() => {
    'useShallowEffect: hasEventHandlers'
    setState({
      ...hasEventHandlers
    })
  }, [hasEventHandlers])

  const viewId = view.id
  useUpdateEffect(() => {
    setState({ viewId })
  }, [viewId])

  useUpdateEffect(() => {
    'useUpdateEffect: view.nodes, view.edges'
    setState(({ viewNodes, viewEdges }) => ({
      viewNodes: isEqual(viewNodes, view.nodes) ? viewNodes : view.nodes,
      viewEdges: isEqual(viewEdges, view.edges) ? viewEdges : view.edges,
      view
    }))
  }, [view])

  // const viewportInitialized = state.xyflow?.viewportInitialized ?? false
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

  const {
    onNavigateTo: _onNavigateTo,
    ...handlers
  } = useStableEventHandlers(isOnlyEventHandlers(eventHandlers))

  const onNavigateTo = useCallback((xynodeId: string, event: React.MouseEvent) => {
    const xynode = xyflow.getNode(xynodeId)
    invariant(xynode, `node not found: ${xynodeId}`)
    const navigateTo = xynode.data.element.navigateTo
    invariant(navigateTo, `node is not navigable: ${xynodeId}`)
    _onNavigateTo({
      element: xynode.data.element as DiagramNodeWithNavigate,
      xynode,
      event
    })
  }, [])

  const xyEvents = useBindEventHandlers(handlers, setState)

  const _state = useCustomCompareMemo(
    () => ({
      ...state,
      onNavigateTo,
      ...xyEvents
    }),
    [state],
    shallowEqual
  )

  useEffect(() => {
    console.log('_state', state)
  }, [_state])

  return [_state, setState] as const
}

export const {
  Provider: DiagramStateProvider,
  useTracked: useDiagramStateContext,
  useTrackedState: useDiagramStateTracked,
  useUpdate: useUpdateDiagramState,
  useSelector: useSelectDiagramState
} = createContainer(useDiagramState_ReactTracked)

export type DiagramState = ReturnType<typeof useDiagramStateTracked>
export type UpdateDiagramState = ReturnType<typeof useUpdateDiagramState>

const useBindEventHandlers = (
  // xyflow: XYFlowInstance,
  handlers: Omit<Handlers, 'onNavigateTo'>,
  update: any
) => {
  // const xyflowRef = useSyncedRef(xyflow)
  // const state = useDiagramStateTracked()
  // const onInitialized = useSyncedRef(state.onInitialized)

  // useDebugValue('useBindEventHandlers')
  // const update = useUpdateDiagramState()

  // const onPaneClickTmout = useRef<NodeJS.Timeout>()

  // console.log('useBindEventHandlers')

  // const onNodeClick: NodeMouseHandler = useCallback((event, xynode) => {
  //   invariant(XYFlowNode.is(xynode), `node is not a XYFlowNode`)
  //   // update({ focusedNodeId: xynode.id })
  //   editor.onNodeClick({
  //     element: xynode.data.element,
  //     xynode,
  //     event
  //   })
  // }, [])
  return {
    onEdgeMouseEnter: useCallback((event, edge) => {
      update({
        hoveredEdgeId: edge.id
      })
    }, []),

    onEdgeMouseLeave: useCallback((event, edge) => {
      update({
        hoveredEdgeId: null
      })
    }, []),

    onInit: useCallback((instance: ReactFlowInstance) => {
      invariant(instance.viewportInitialized, `viewportInitialized is not true`)
      update({
        viewportInitialized: true
      })
      handlers.onInitialized(instance as XYFlowInstance)
    }, [handlers.onInitialized]),

    onNodeClick: useCallback((event, xynode) => {
      invariant(XYFlowNode.is(xynode), `node is not a XYFlowNode`)
      // update({ focusedNodeId: xynode.id })
      handlers.onNodeClick({
        element: xynode.data.element,
        xynode,
        event
      })
    }, [handlers.onNodeClick]),

    onEdgeClick: useCallback((event, xyedge) => {
      invariant(XYFlowEdge.isRelationship(xyedge), `edge is not a relationship`)
      handlers.onEdgeClick({
        relation: xyedge.data.edge,
        xyedge,
        event
      })
    }, [handlers.onEdgeClick])
    // const onEdgeContextMenu = useCallback((event, edge) => {
    //   event.preventDefault()
    //   event.stopPropagation()
    // }, [])
    // const onNodeContextMenu: NodeMouseHandler = useCallback((event, node) => {
    //   invariant(XYFlowNode.is(node), `node is not a XYFlowNode`)
    //   trigger.onNodeContextMenu(node, event)
    // }, [])
    // const onPaneContextMenu: NodeMouseHandler = useCallback((event) => {
    //   event.preventDefault()
    //   event.stopPropagation()
    // }, [])
  } satisfies ReactFlowProps
}
