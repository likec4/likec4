import type { LayoutedView, ViewId } from '@likec4/core/types'
import { selectDiagramContext, useDiagramSelector } from './useDiagram'

const selectViewId = selectDiagramContext(s => s.view.id)

/**
 * Returns current view id
 * Should be used only inside LikeC4Diagram
 */
export function useCurrentViewId(): ViewId {
  return useDiagramSelector(selectViewId)
}

const selectView = selectDiagramContext(s => s.view)
/**
 * Returns current view
 * Should be used only inside LikeC4Diagram
 */
export function useCurrentView(): LayoutedView {
  return useDiagramSelector(selectView)
}
