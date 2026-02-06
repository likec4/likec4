import type { LayoutedView, ViewId } from '@likec4/core/types'
import { selectDiagramActor, useDiagramSnapshot } from './useDiagram'

const selectViewId = selectDiagramActor(s => s.context.view.id)

/**
 * Returns current view id
 * Should be used only inside LikeC4Diagram
 */
export function useCurrentViewId(): ViewId {
  return useDiagramSnapshot(selectViewId)
}

const selectView = selectDiagramActor(s => s.context.view)
/**
 * Returns current view
 * Should be used only inside LikeC4Diagram
 */
export function useCurrentView(): LayoutedView {
  return useDiagramSnapshot(selectView)
}
