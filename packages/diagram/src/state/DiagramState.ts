import {
  useCustomCompareEffect,
  useCustomCompareMemo,
  useIsomorphicLayoutEffect as useLayoutEffect,
  useSyncedRef
} from '@react-hookz/web'
import { shallowEqual } from 'fast-equals'
import { createContainer } from 'react-tracked'
import { useSetState } from '../hooks/use-set-state'
import { isOnlyEventHandlers, type LikeC4DiagramEventHandlers, type OnNavigateTo } from '../LikeC4Diagram.props'

type DiagramStateProps = LikeC4DiagramEventHandlers & {
  disableHovercards: boolean
}

const useDiagramStateValue = ({
  disableHovercards,
  ...eventHandlers
}: DiagramStateProps) => {
  isOnlyEventHandlers(eventHandlers)

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

  const [state, setState] = useSetState({
    viewportInitialized: false,
    hoveredNodeId: null as null | string,
    hoveredEdgeId: null as null | string
  })

  const _state = useCustomCompareMemo(
    () => ({
      disableHovercards,
      ...hasEventHandlers,
      ...state
    }),
    [state, hasEventHandlers, disableHovercards],
    shallowEqual
  )

  return [_state, setState] as const
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
