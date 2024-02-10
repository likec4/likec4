import { type DiagramEdge, type DiagramNode, type DiagramView } from '@likec4/core'
import { useSetState } from '@mantine/hooks'
import { useSyncedRef, useUpdateEffect } from '@react-hookz/web'
import type { ReactFlowInstance } from '@xyflow/react'
import { useRef } from 'react'
import { createContainer } from 'react-tracked'
import type { SetRequired, Simplify } from 'type-fest'
import type { ChangeCommand, EditorNode, OnChange } from './types'

export type DiagramNodeWithNavigate = Simplify<SetRequired<DiagramNode, 'navigateTo'>>

export type OnNavigateTo = (elementNode: DiagramNodeWithNavigate) => void
export type OnNodeClick = (element: DiagramNode, event: React.MouseEvent) => void
export type OnEdgeClick = (relation: DiagramEdge, event: React.MouseEvent) => void

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
  // const onChangeRef = useSyncedRef(onChange)
  // const onNavigateToRef = useSyncedRef(onNavigateTo)
  // const onNodeClickRef = useSyncedRef(onNodeClick)
  // const onNodeContextMenu = useSyncedRef(onNodeContextMenu)
  // const onEdgeClickRef = useSyncedRef(onEdgeClick)

  const reactflowRef = useRef<ReactFlowInstance | null>(null)

  // const storeApi = useStoreApi()
  const isNavigateBtnVisible = !!eventHandlers.onNavigateTo

  const [state, setState] = useSetState({
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
    reactflow: null as null | ReactFlowInstance,
    isNavigateBtnVisible,
    triggerChange: (changeCommand: ChangeCommand) => {
      eventsRef.current.onChange?.(changeCommand)
    },
    navigateTo: (elementnode: EditorNode.Data) => {
      const callback = eventsRef.current.onNavigateTo
      if (elementnode.navigateTo && callback) {
        callback(elementnode as DiagramNodeWithNavigate)
      }
    },
    onNodeClick: (element: DiagramNode, event: React.MouseEvent) => {
      eventsRef.current.onNodeClick?.(element, event)
    },
    onEdgeClick: (edge: DiagramEdge, event: React.MouseEvent) => {
      eventsRef.current.onEdgeClick?.(edge, event)
    },
    onNodeContextMenu: (element: DiagramNode, event: React.MouseEvent) => {
      const callback = eventsRef.current.onNodeContextMenu
      if (callback) {
        callback(element, event)
      } else {
        event.preventDefault()
        event.stopPropagation()
      }
    }
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
      isNavigateBtnVisible,
      fitViewPadding,
      colorMode,
      controls,
      viewId: view.id,
      pannable,
      zoomable,
      readonly,
      disableBackground,
      nodesSelectable,
      nodesDraggable
    })
  }, [
    isNavigateBtnVisible,
    fitViewPadding,
    colorMode,
    controls,
    view.id,
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
  useTracked: useLikeC4EditorState,
  useTrackedState: useLikeC4Editor,
  useUpdate: useLikeC4EditorUpdate,
  useSelector: useLikeC4EditorSelector
} = createContainer(useEditorState)
