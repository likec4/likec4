import { invariant } from '@likec4/core'
import { useMantineColorScheme } from '@mantine/core'
import { isEqual } from '@react-hookz/deep-equal'
import { useCustomCompareMemo, useIsomorphicLayoutEffect as useLayoutEffect, useSyncedRef } from '@react-hookz/web'
import type { Edge, ReactFlowInstance } from '@xyflow/react'
import { shallowEqual } from 'fast-equals'
import { useCallback, useEffect, useRef } from 'react'
import { createContainer } from 'react-tracked'
import type { Exact } from 'type-fest'
import { useSetState } from '../hooks'
import type {
  DiagramNodeWithNavigate,
  LikeC4DiagramEventHandlers,
  LikeC4DiagramProps,
  LikeC4ViewColorMode
} from '../props'
import { useXYFlow } from '../xyflow/hooks'
import { type XYFlowEdge, type XYFlowInstance, type XYFlowNode } from '../xyflow/types'

// Guard, Ensure that object contains only event handlers
function isOnlyEventHandlers<T extends Exact<LikeC4DiagramEventHandlers, T>>(handlers: T): T {
  return handlers
}

type Handlers =
  & Omit<
    {
      [K in keyof LikeC4DiagramEventHandlers]-?: NonNullable<LikeC4DiagramEventHandlers[K]>
    },
    | 'onNavigateTo'
    | 'onNodeClick'
    | 'onEdgeClick'
    | 'onCanvasDblClick'
    | 'onInitialized'
    | 'onNodeContextMenu'
    | 'onEdgeContextMenu'
    | 'onCanvasContextMenu'
  >
  & {
    onNavigateTo: (xynodeId: string, event: React.MouseEvent) => void
  }

const useDiagramPropsHook = ({
  view,
  colorMode = 'system',
  readonly = false,
  pannable = true,
  zoomable = true,
  controls = !readonly,
  nodesSelectable = !readonly,
  nodesDraggable = !readonly,
  fitOnSelect = zoomable && nodesSelectable,
  disableBackground = false,
  disableHovercards = false,
  fitViewPadding = 0.05,
  ...eventHandlers
}: LikeC4DiagramProps) => {
  const hasEventHandlers = {
    hasOnNavigateTo: !!eventHandlers.onNavigateTo,
    hasOnNodeClick: !!eventHandlers.onNodeClick,
    hasOnNodeContextMenu: !!eventHandlers.onNodeContextMenu,
    hasOnCanvasContextMenu: !!eventHandlers.onCanvasContextMenu,
    hasOnEdgeContextMenu: !!eventHandlers.onEdgeContextMenu,
    hasOnContextMenu: !!eventHandlers.onNodeContextMenu || !!eventHandlers.onCanvasContextMenu
      || !!eventHandlers.onEdgeContextMenu,
    hasOnEdgeClick: !!eventHandlers.onEdgeClick,
    hasOnCanvasClick: !!eventHandlers.onCanvasClick || !!eventHandlers.onCanvasDblClick
  }

  // const { colorScheme } = useMantineColorScheme()

  const [state, setState] = useSetState({
    viewId: view.id,
    view,
    viewNodes: view.nodes,
    viewEdges: view.edges,
    hoveredNodeId: null as null | string,
    hoveredEdgeId: null as null | string,
    disableBackground,
    disableHovercards,
    fitViewPadding,
    colorMode,
    controls,
    pannable,
    zoomable,
    fitOnSelect,
    readonly,
    nodesSelectable,
    nodesDraggable,
    viewportInitialized: false
  })

  const viewId = view.id
  useLayoutEffect(() => {
    setState({
      viewId,
      hoveredNodeId: null,
      hoveredEdgeId: null
    })
  }, [viewId])

  useLayoutEffect(() => {
    setState(({ viewNodes, viewEdges }) => ({
      viewNodes: isEqual(viewNodes, view.nodes) ? viewNodes : view.nodes,
      viewEdges: isEqual(viewEdges, view.edges) ? viewEdges : view.edges,
      view
    }))
  }, [view])

  // const viewportInitialized = state.xyflow?.viewportInitialized ?? false
  useLayoutEffect(() => {
    setState({
      fitViewPadding,
      colorMode,
      controls,
      pannable,
      zoomable,
      fitOnSelect,
      readonly,
      disableBackground,
      disableHovercards,
      nodesSelectable,
      nodesDraggable
    })
  }, [
    fitViewPadding,
    colorMode,
    controls,
    pannable,
    zoomable,
    fitOnSelect,
    readonly,
    disableBackground,
    disableHovercards,
    nodesSelectable,
    nodesDraggable
  ])

  const _eventHandlers = isOnlyEventHandlers(eventHandlers)
  const eventHandlersRef = useRef(_eventHandlers)
  Object.assign(eventHandlersRef.current, _eventHandlers)

  const xyflow = useXYFlow()
  const xyflowRef = useSyncedRef(xyflow)
  const handlersRef = useRef<Handlers>()
  const dblclickTimeout = useRef<number>()
  if (!handlersRef.current) {
    handlersRef.current = {
      onCanvasClick: (args) => {
        if (!eventHandlersRef.current.onCanvasDblClick) {
          eventHandlersRef.current.onCanvasClick?.(args)
          return
        }

        if (dblclickTimeout.current) {
          window.clearTimeout(dblclickTimeout.current)
          dblclickTimeout.current = undefined
          eventHandlersRef.current.onCanvasDblClick(args)
          return
        }

        dblclickTimeout.current = window.setTimeout(() => {
          dblclickTimeout.current = undefined
          eventHandlersRef.current.onCanvasClick?.(args)
        }, 300)
      },
      // onNodeContextMenu: (args) => {
      //   eventHandlersRef.current.onNodeContextMenu?.(args)
      // },
      // onCanvasContextMenu: (args) => {
      //   eventHandlersRef.current.onCanvasContextMenu?.(args)
      // },
      // onEdgeContextMenu: (args) => {
      //   eventHandlersRef.current.onEdgeContextMenu?.(args)
      // },
      onNavigateTo: (xynodeId, event) => {
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

  const onInit = useCallback((instance: ReactFlowInstance<any, any>) => {
      invariant(instance.viewportInitialized, `viewportInitialized is not true`)
      setState({
        viewportInitialized: true
      })
      // eventHandlersRef.current.onInitialized?.(instance as unknown as XYFlowInstance)
    }, []),
    onNodeClick = useCallback((event: React.MouseEvent, xynode: XYFlowNode) => {
      eventHandlersRef.current.onNodeClick?.({
        element: xynode.data.element,
        xynode,
        event
      })
    }, []),
    onNodeContextMenu = useCallback((event: React.MouseEvent, xynode: XYFlowNode) => {
      eventHandlersRef.current.onNodeContextMenu?.({
        element: xynode.data.element,
        xynode,
        event
      })
    }, []),
    onEdgeContextMenu = useCallback((event: React.MouseEvent, xyedge: XYFlowEdge) => {
      eventHandlersRef.current.onEdgeContextMenu?.({
        relation: xyedge.data.edge,
        xyedge,
        event
      })
    }, []),
    onCanvasContextMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
      eventHandlersRef.current.onCanvasContextMenu?.(event as any)
    }, []),
    onNodeMouseEnter = useCallback((event: React.MouseEvent, xynode: XYFlowNode) => {
      setState({
        hoveredNodeId: xynode.id
      })
    }, []),
    onNodeMouseLeave = useCallback((event: React.MouseEvent, xynode: XYFlowNode) => {
      setState({
        hoveredNodeId: null
      })
    }, []),
    onEdgeMouseEnter = useCallback((event: React.MouseEvent, edge: Edge) => {
      setState({
        hoveredEdgeId: edge.id
      })
    }, []),
    onEdgeMouseLeave = useCallback((event: React.MouseEvent, edge: Edge) => {
      setState({
        hoveredEdgeId: null
      })
    }, []),
    onEdgeClick = useCallback((event: React.MouseEvent, xyedge: XYFlowEdge) => {
      eventHandlersRef.current.onEdgeClick?.({
        relation: xyedge.data.edge,
        xyedge,
        event
      })
    }, [])

  const _state = useCustomCompareMemo(
    () => ({
      onInit,
      onEdgeMouseEnter,
      onEdgeMouseLeave,
      onNodeMouseEnter,
      onNodeMouseLeave,
      onNodeContextMenu,
      onEdgeContextMenu,
      onCanvasContextMenu,
      onNodeClick,
      onEdgeClick,
      ...handlersRef.current!,
      ...hasEventHandlers,
      ...state
    }),
    [state, hasEventHandlers],
    shallowEqual
  )

  // useEffect(() => {
  //   console.log('_state', state)
  // }, [_state])

  return [_state, setState] as const
}

export const {
  /**
   * @deprecated
   */
  Provider: DiagramStateProvider,
  /**
   * @deprecated
   */
  useTracked: useDiagramStateContext,
  /**
   * @deprecated
   */
  useTrackedState: useDiagramStateTracked,
  useUpdate: useUpdateDiagramState,
  useSelector: useSelectDiagramState
} = createContainer((props: LikeC4DiagramProps) => useDiagramPropsHook(props), {
  concurrentMode: false,
  stateContextName: 'DiagramStateContext'
})

export type DiagramState = ReturnType<typeof useDiagramStateTracked>
export type UpdateDiagramState = ReturnType<typeof useUpdateDiagramState>
