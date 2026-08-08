import type * as t from '@likec4/core/types'

/**
 * Result of applying a change from the LikeC4 Editor.
 */
export interface LikeC4EditorChangeResult {
  /**
   * Whether applying the change will publish a refreshed view to the diagram
   * that the editor should wait for.
   *
   * Returning no result from `handleChange` defaults this to `true`,
   * preserving the existing behavior for integrations that persist changes
   * through an external model service.
   */
  waitForViewSync: boolean
}

export function shouldWaitForViewSync(
  result?: void | LikeC4EditorChangeResult,
): boolean {
  return result?.waitForViewSync ?? true
}

/**
 * Callbacks from LikeC4 Editor.
 */
export interface LikeC4EditorCallbacks {
  /**
   * Apply semantic layout to a view (if AI is available)
   * See vite-plugin settings for more details
   */
  applySemanticLayout?: undefined | ((viewId: t.ViewId) => Promise<void>)

  /**
   * Fetch a view by its ID and layout type.
   *
   * @param viewId - The ID of the view to fetch.
   * @param layout - The layout type to use when fetching the view.
   */
  fetchView(viewId: t.ViewId, layout?: t.LayoutType): t.LayoutedView | Promise<t.LayoutedView>

  /**
   * Callback invoked when the view changes.
   *
   * Return `{ waitForViewSync: false }` when the integration applies the
   * change locally and will not publish a refreshed view. When changes are
   * batched, the editor waits if any callback invocation expects a refresh.
   */
  handleChange(
    viewId: t.ViewId,
    change: t.ViewChange,
  ): void | LikeC4EditorChangeResult | Promise<void | LikeC4EditorChangeResult>
}

export function createLikeC4Editor(callbacks: LikeC4EditorCallbacks): LikeC4EditorCallbacks {
  return callbacks
}
