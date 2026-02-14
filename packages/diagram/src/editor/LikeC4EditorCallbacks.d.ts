import type * as t from '@likec4/core/types';
/**
 * Callbacks from LikeC4 Editor.
 */
export interface LikeC4EditorCallbacks {
    /**
     * Fetch a view by its ID and layout type.
     *
     * @param viewId - The ID of the view to fetch.
     * @param layout - The layout type to use when fetching the view.
     */
    fetchView(viewId: t.ViewId, layout?: t.LayoutType): t.LayoutedView | Promise<t.LayoutedView>;
    /**
     * Callback invoked when the view changes.
     */
    handleChange(viewId: t.ViewId, change: t.ViewChange): void | Promise<void>;
}
export declare function createLikeC4Editor(callbacks: LikeC4EditorCallbacks): LikeC4EditorCallbacks;
