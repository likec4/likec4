import type { AdhocViewPredicate } from '@likec4/core/compute-view'
import type { LayoutedElementView, ProjectId, ViewChange, ViewId } from '@likec4/core/types'

export interface LikeC4VitePluginRpc {
  /**
   * Apply semantic layout (if AI is available)
   * See vite-plugin for more details
   *
   * (Available in the dev server)
   */
  applySemanticLayout(payload: {
    projectId: ProjectId
    viewId: ViewId
  }): Promise<void>
  /**
   * Send a view change to the server
   * (Available in the dev server)
   */
  updateView(payload: {
    projectId: ProjectId
    viewId: ViewId
    change: ViewChange
  }): Promise<void>

  /**
   * Calculate an adhoc view
   * (Available in the dev server)
   */
  calcAdhocView(payload: {
    projectId: ProjectId
    predicates: AdhocViewPredicate[]
  }): Promise<LayoutedElementView>
}
