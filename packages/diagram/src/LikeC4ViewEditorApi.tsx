import { type DiagramNode, type DiagramView, invariant } from '@likec4/core'
import { useSetState } from '@mantine/hooks'
import { useUpdateEffect } from '@react-hookz/web'
import { useRef } from 'react'
import { createContainer } from 'react-tracked'
import type { SetRequired } from 'type-fest'
import type { EditorNode } from './types'

export type LikeC4ViewEditorApiProps = {
  view: DiagramView
  onNavigateTo?: undefined | ((node: SetRequired<DiagramNode, 'navigateTo'>) => void)
}

const useEditorState = (props: LikeC4ViewEditorApiProps) => {
  const ref = useRef(props)
  ref.current = props

  // const storeApi = useStoreApi()

  const [state, setState] = useSetState({
    viewId: props.view.id,
    hoveredEdgeId: null as null | string,
    isNavigateBtnVisible: !!props.onNavigateTo,
    navigateTo: (node: EditorNode.BaseData) => {
      const callback = ref.current.onNavigateTo
      if (!callback) return
      const diagramNode = ref.current.view.nodes.find(n => n.id === node.fqn)
      invariant(diagramNode?.navigateTo, `Node ${node.fqn} not found`)
      callback(diagramNode as SetRequired<DiagramNode, 'navigateTo'>)
    }
  })

  const isNavigateBtnVisible = !!props.onNavigateTo

  useUpdateEffect(() => {
    setState({
      isNavigateBtnVisible
    })
  }, [isNavigateBtnVisible])

  useUpdateEffect(() => {
    setState({
      viewId: props.view.id
    })
  }, [props.view.id])

  // const [_, setApi] = pair
  // useShallowEffect(() => {
  //   setApi(current => ({
  //     ...current,
  //     ...props,
  //   }))
  // }, [props])
  return [state, setState] as const
}

export const {
  Provider: LikeC4ViewEditorProvider,
  useTrackedState: useLikeC4Editor,
  useUpdate: useLikeC4EditorUpdate,
  useSelector: useLikeC4EditorSelector
} = createContainer(useEditorState)
