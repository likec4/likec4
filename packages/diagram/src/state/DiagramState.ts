import type { DiagramView } from '@likec4/core'
import { useCustomCompareMemo } from '@react-hookz/web'
import { shallowEqual } from 'fast-equals'
import { createContainer } from 'react-tracked'
import { useSetState } from '../hooks/use-set-state'
import { type LikeC4DiagramEventHandlers } from '../LikeC4Diagram.props'

type DiagramStateProps = {
  /**
   * If nodes are interactive, they can be selected, dragged, etc.
   */
  isNodeInteractive: boolean
  view: DiagramView
  fitViewPadding: number
  readonly: boolean
  disableHovercards: boolean
  eventHandlers: LikeC4DiagramEventHandlers
}

const useDiagramStateValue = ({
  isNodeInteractive,
  view,
  fitViewPadding,
  readonly,
  disableHovercards,
  eventHandlers
}: DiagramStateProps) => {
  const hasEventHandlers = {
    hasOnChange: !!eventHandlers.onChange,
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
    // User moved the viewport
    viewportMoved: false,
    hoveredNodeId: null as null | string,
    hoveredEdgeId: null as null | string
  })

  const readonlyProps = {
    readonly,
    disableHovercards,
    isNodeInteractive,
    viewId: view.id,
    viewLayout: view.autoLayout,
    viewWidth: view.width,
    viewHeight: view.height,
    fitViewPadding
  }

  const _state = useCustomCompareMemo(
    () => ({
      ...readonlyProps,
      ...hasEventHandlers,
      ...state
    }),
    [state, readonlyProps, hasEventHandlers],
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
} = /* @__PURE__ */ createContainer(useDiagramStateValue, {
  concurrentMode: false,
  stateContextName: 'DiagramStateContext'
})

export type DiagramState = ReturnType<typeof useDiagramState>
export type UpdateDiagramState = ReturnType<typeof useUpdateDiagramState>