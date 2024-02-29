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
import { useXYFlow } from '../xyflow'
import { type XYFlowInstance } from '../xyflow/types'

// Guard, Ensure that object contains only event handlers
function isOnlyEventHandlers<T extends Exact<LikeC4DiagramEventHandlers, T>>(handlers: T): T {
  return handlers
}

type Handlers =
  & Omit<
    {
      [K in keyof LikeC4DiagramEventHandlers]-?: NonNullable<LikeC4DiagramEventHandlers[K]>
    },
    'onNavigateTo' | 'onInitialized'
  >
  & {
    onNavigateTo: (xynodeId: string, event: React.MouseEvent) => void
  }

const useDiagramPropsHook = ({
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
    viewportInitialized: false
  })

  const viewId = view.id
  useLayoutEffect(() => {
    setState({ viewId })
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

  const _eventHandlers = isOnlyEventHandlers(eventHandlers)
  const eventHandlersRef = useRef(_eventHandlers)
  Object.assign(eventHandlersRef.current, _eventHandlers)

  const xyflow = useXYFlow()
  const xyflowRef = useSyncedRef(xyflow)
  const handlersRef = useRef<Handlers>()
  if (!handlersRef.current) {
    handlersRef.current = {
      onCanvasClick: (args) => {
        eventHandlersRef.current.onCanvasClick?.(args)
      },
      onCanvasDblClick: (args) => {
        eventHandlersRef.current.onCanvasDblClick?.(args)
      },
      onEdgeClick: (args) => {
        eventHandlersRef.current.onEdgeClick?.(args)
      },
      onNodeClick: (args) => {
        eventHandlersRef.current.onNodeClick?.(args)
      },
      onNodeContextMenu: (args) => {
        eventHandlersRef.current.onNodeContextMenu?.(args)
      },
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

  const onInit = useCallback((instance: ReactFlowInstance) => {
      invariant(instance.viewportInitialized, `viewportInitialized is not true`)
      setState({
        viewportInitialized: true
      })
      eventHandlersRef.current.onInitialized?.(instance as XYFlowInstance)
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
    }, [])

  const _state = useCustomCompareMemo(
    () => ({
      onInit,
      onEdgeMouseEnter,
      onEdgeMouseLeave,
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
  Provider: DiagramStateProvider,
  useTracked: useDiagramStateContext,
  useTrackedState: useDiagramStateTracked,
  useUpdate: useUpdateDiagramState,
  useSelector: useSelectDiagramState
} = createContainer((props: LikeC4DiagramProps) => useDiagramPropsHook(props), {
  concurrentMode: false,
  stateContextName: 'DiagramStateContext'
})

export type DiagramState = ReturnType<typeof useDiagramStateTracked>
export type UpdateDiagramState = ReturnType<typeof useUpdateDiagramState>
