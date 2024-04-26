import type { DiagramState } from './types'
import { useDiagramStore } from './useDiagramStore'

const selector = (state: DiagramState) => ({
  hasOnChange: !!state.onChange,
  hasOnNavigateTo: !!state.onNavigateTo,
  hasOnNodeClick: !!state.onNodeClick,
  hasOnNodeContextMenu: !!state.onNodeContextMenu,
  hasOnCanvasContextMenu: !!state.onCanvasContextMenu,
  hasOnEdgeContextMenu: !!state.onEdgeContextMenu,
  hasOnContextMenu: !!state.onNodeContextMenu
    || !!state.onCanvasContextMenu
    || !!state.onEdgeContextMenu,
  hasOnEdgeClick: !!state.onEdgeClick,
  hasOnCanvasClick: !!state.onCanvasClick || !!state.onCanvasDblClick
})

export function useHasEventHandlers() {
  return useDiagramStore(selector)
}
