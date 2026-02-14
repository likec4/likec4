import { type PropsWithChildren } from 'react';
import type { LikeC4EditorCallbacks } from './LikeC4EditorCallbacks';
export type LikeC4EditorProviderProps = PropsWithChildren<{
    editor: LikeC4EditorCallbacks;
}>;
/**
 * Provider for the LikeC4 Editor.
 * @example
 * ```tsx
 *
 * // Not required to use memo for editor callbacks
 * const editor = createLikeC4Editor({
 *   fetchView: async (viewId, layout) => {
 *     // fetch view logic
 *   },
 *   handleChange: (viewId, change) => {
 *     // handle change logic
 *   }
 * })
 *
 * <LikeC4EditorProvider
 *  editor={editor}>
 *   <App />
 * </LikeC4EditorProvider>
 * ```
 */
export declare function LikeC4EditorProvider({ children, editor }: LikeC4EditorProviderProps): import("react").JSX.Element;
/**
 * Component that ensures the editor context is available.
 *
 * @param children - The children to render.
 */
export declare function EnsureEditorContext({ children }: PropsWithChildren): import("react").JSX.Element;
export declare function useOptionalLikeC4Editor(): LikeC4EditorCallbacks;
