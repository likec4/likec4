import { useIsomorphicLayoutEffect as useLayoutEffect, useSyncedRef } from '@react-hookz/web'
import { useEffect } from 'react'
import { createContainer } from 'react-tracked'
import { useSetState } from './hooks/use-set-state'
import type { LikeC4DiagramProps, OnNavigateTo } from './props'

type DiagramStateProps = Pick<LikeC4DiagramProps, 'onNavigateTo'> & {
  disableHovercards: boolean
}

const useDiagramStateValue = ({
  disableHovercards,
  onNavigateTo
}: DiagramStateProps) => {
  const onNavigateToRef = useSyncedRef(onNavigateTo)

  const [state, setState] = useSetState({
    viewportInitialized: false,
    hasOnNavigateTo: !!onNavigateTo,
    onNavigateTo: <OnNavigateTo> ((args) => {
      onNavigateToRef.current?.(args)
    }),
    hoveredNodeId: null as null | string,
    hoveredEdgeId: null as null | string,
    disableHovercards
  })

  useEffect(() => {
    setState({
      hasOnNavigateTo: !!onNavigateTo,
      disableHovercards
    })
  }, [
    !!onNavigateTo,
    disableHovercards
  ])

  return [state, setState] as const
}

export const {
  Provider: DiagramStateProvider,
  useTracked: useDiagramStateTracked,
  useTrackedState: useDiagramState,
  useUpdate: useUpdateDiagramState,
  useSelector: useDiagramStateSelector
} = createContainer(useDiagramStateValue, {
  concurrentMode: false,
  stateContextName: 'DiagramStateContext'
})

export type DiagramState = ReturnType<typeof useDiagramState>
export type UpdateDiagramState = ReturnType<typeof useUpdateDiagramState>
