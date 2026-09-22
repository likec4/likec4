import type { EdgeRouting, LayoutedView, ViewId } from '@likec4/core/types'
import { viewRouting } from '../utils/view-routing'
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

const selectViewRouting = selectDiagramContext(s => viewRouting(s.view))
/**
 * Returns the current view's resolved routing mode, defaulting to `spline`.
 *
 * Use this hook inside `LikeC4Diagram`.
 */
export function useCurrentViewRouting(): EdgeRouting {
  return useDiagramSelector(selectViewRouting)
}
