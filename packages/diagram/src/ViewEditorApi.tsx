import { type DiagramNode, type DiagramView } from '@likec4/core'
import { useSetState } from '@mantine/hooks'
import { useSyncedRef, useUpdateEffect } from '@react-hookz/web'
import type { ReactFlowInstance } from '@xyflow/react'
import { useRef } from 'react'
import { createContainer } from 'react-tracked'
import type { SetRequired, Simplify } from 'type-fest'
import type { ChangeCommand, EditorNode } from './types'

export type DiagramNodeWithNavigate = Simplify<SetRequired<DiagramNode, 'navigateTo'>>

export type OnNavigateTo = (elementNode: DiagramNodeWithNavigate) => void
export type OnChange = (operation: ChangeCommand) => void

export interface LikeC4ViewEditorApiProps {
  view: DiagramView
  readonly?: boolean | undefined
  nodesSelectable?: boolean | undefined
  nodesDraggable?: boolean | undefined
  disableBackground?: boolean | undefined
  onNavigateTo?: OnNavigateTo | undefined
}

const useEditorState = ({
  view,
  readonly = false,
  nodesSelectable = true,
  nodesDraggable = !readonly,
  disableBackground = false,
  onNavigateTo
}: LikeC4ViewEditorApiProps) => {
  const ref = useSyncedRef(onNavigateTo)

  const reactflowRef = useRef<ReactFlowInstance | null>(null)

  // const storeApi = useStoreApi()
  const isNavigateBtnVisible = !!onNavigateTo

  const [state, setState] = useSetState({
    disableBackground,
    readonly,
    nodesSelectable,
    nodesDraggable,
    viewId: view.id,
    reactflow: null as null | ReactFlowInstance,
    isNavigateBtnVisible,
    navigateTo: (elementnode: EditorNode.Data) => {
      const callback = ref.current
      if (elementnode.navigateTo && callback) {
        callback(elementnode as DiagramNodeWithNavigate)
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
      viewId: view.id,
      readonly,
      disableBackground,
      nodesSelectable,
      nodesDraggable
    })
  }, [
    isNavigateBtnVisible,
    view.id,
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
