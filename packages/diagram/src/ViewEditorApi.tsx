import { type DiagramEdge, type DiagramNode, type DiagramView, invariant } from '@likec4/core'
import { useSetState, useShallowEffect } from '@mantine/hooks'
import { isEqual } from '@react-hookz/deep-equal'
import { useCustomCompareEffect, useSyncedRef, useUpdateEffect } from '@react-hookz/web'
import type { ReactFlowInstance } from '@xyflow/react'
import { useMemo, useRef } from 'react'
import { createContainer, getUntrackedObject } from 'react-tracked'
import type { SetRequired, Simplify } from 'type-fest'
import type { ChangeCommand, EditorEdge, EditorNode, OnChange } from './types'

export type DiagramNodeWithNavigate = Simplify<SetRequired<DiagramNode, 'navigateTo'>>

export type OnNavigateTo = (elementNode: DiagramNodeWithNavigate) => void
export type OnNodeClick = (args: { element: DiagramNode; node: EditorNode; event: React.MouseEvent }) => void
export type OnEdgeClick = (args: { relation: DiagramEdge; edge: EditorEdge; event: React.MouseEvent }) => void

export type LikeC4ViewEditorApiProps = {
  view: DiagramView
  /** Controls color scheme used for styling the flow
   * @default 'system'
   * @example 'system' | 'light' | 'dark'
   */
  colorMode?: 'system' | 'light' | 'dark' | undefined
  /**
   * Show/hide controls menu
   * @default true
   */
  controls?: boolean | undefined
  /**
   * Enable/disable panning
   * @default true
   */
  pannable?: boolean | undefined
  /**
   * Enable/disable zooming
   * @default true
   */
  zoomable?: boolean | undefined
  /**
   * Disable any editing (dragging still can be enabled with `nodesDraggable`)
   * @default false
   */
  readonly?: boolean | undefined
  /**
   * Seems like this is percentage of the view size
   * @default 0.05
   */
  fitViewPadding?: number | undefined

  nodesSelectable?: boolean | undefined
  nodesDraggable?: boolean | undefined
  disableBackground?: boolean | undefined
  onChange?: OnChange | undefined
  onNavigateTo?: OnNavigateTo | undefined
  onNodeClick?: OnNodeClick | undefined
  onNodeContextMenu?: OnNodeClick | undefined
  onEdgeClick?: OnEdgeClick | undefined
  onInitialized?: ((reactflow: ReactFlowInstance) => void) | undefined
}

const useEditorState = ({
  view,
  colorMode = 'system',
  readonly = false,
  pannable = true,
  zoomable = true,
  controls = !readonly,
  nodesSelectable = !readonly,
  nodesDraggable = !readonly,
  disableBackground = false,
  fitViewPadding = 0.05,
  ...eventHandlers
  // onChange,
  // onNavigateTo,
  // onNodeClick,
  // onNodeContextMenu,
  // onEdgeClick
}: LikeC4ViewEditorApiProps) => {
  const eventsRef = useSyncedRef(eventHandlers)

  const hasEventHandlers = {
    hasOnChange: !!eventHandlers.onChange,
    hasOnNavigateTo: !!eventHandlers.onNavigateTo,
    hasOnNodeClick: !!eventHandlers.onNodeClick,
    hasOnNodeContextMenu: !!eventHandlers.onNodeContextMenu,
    hasOnEdgeClick: !!eventHandlers.onEdgeClick
  }

  const reactflowRef = useRef<ReactFlowInstance | null>(null)

  const [state, setState] = useSetState({
    view,
    viewNodes: view.nodes,
    viewEdges: view.edges,
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
    viewId: view.id,
    ...hasEventHandlers,
    reactflow: null as null | ReactFlowInstance
    // fitView: () => {
    //   const reactflowApi = reactflowRef.current
    //   invariant(reactflowApi, `reactflowApi is null`)
    //   const zoom = reactflowApi.getZoom()
    //   reactflowApi.fitView({
    //     // duration: 350,
    //     maxZoom: Math.max(1.05, zoom),
    //     padding: 0.1
    //   })
    // }
    // const scheduleFitViewAnimation = useDebouncedCallback(
    //   () => {
    //     if (isMounted()) {
    //       console.log(`scheduleFitViewAnimation`)
    //       previousViewport.current = null
    //       const zoom = reactflowApi.getZoom()
    //       reactflowApi.fitView({
    //         // duration: 350,
    //         maxZoom: Math.max(1.05, zoom),
    //         padding: 0.1
    //       })
    //     }
    //   },
    //   [reactflowApi],
    //   200
    // )
  })

  reactflowRef.current = state.reactflow

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
  Provider: LikeC4EditorProvider,
  useTracked: useLikeC4EditorTracked,
  useTrackedState: useLikeC4Editor,
  useUpdate: useLikeC4EditorUpdate,
  useSelector: useLikeC4EditorSelector
} = createContainer(useEditorState)

export const useLikeC4EditorTriggers = () => {
  const [editor, update] = useLikeC4EditorTracked()
  const eventsRef = getUntrackedObject(editor.eventHandlers)
  invariant(eventsRef, `eventsRef is null`)
  return useMemo(() => {
    // const eventsRef =
    return ({
      onChange: (changeCommand: ChangeCommand) => {
        console.debug('Trigger.onChange', changeCommand)
        eventsRef.current.onChange?.(changeCommand)
      },
      onNavigateTo: <N extends Pick<EditorNode, 'id' | 'data'>>(node: N) => {
        const callback = eventsRef.current.onNavigateTo
        if (node.data.navigateTo && callback) {
          callback({
            ...node.data,
            navigateTo: node.data.navigateTo
          })
        }
      },

      onNodeClick: (node: EditorNode, event: React.MouseEvent) => {
        eventsRef.current.onNodeClick?.({
          element: node.data,
          node,
          event
        })
      },

      onEdgeClick: (edge: EditorEdge, event: React.MouseEvent) => {
        eventsRef.current.onEdgeClick?.({
          relation: edge.data.edge,
          edge,
          event
        })
      },

      onNodeContextMenu: (node: EditorNode, event: React.MouseEvent) => {
        const callback = eventsRef.current.onNodeContextMenu
        if (callback) {
          callback({
            element: node.data,
            node,
            event
          })
        } else {
          event.preventDefault()
          event.stopPropagation()
        }
      },

      onInitialized: (reactflow: ReactFlowInstance) => {
        console.debug('Trigger.onInitialized', { reactflow })
        update({ reactflow })
        eventsRef.current.onInitialized?.(reactflow)
      }
    })
  }, [eventsRef, update])
}
