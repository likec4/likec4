import type * as t from '@likec4/core/types'
import { type PropsWithChildren, createContext, useContext } from 'react'

export type LikeC4EditorPort = {
  /**
   * Fetch a view by its ID and layout type.
   *
   * @param viewId - The ID of the view to fetch.
   * @param layout - The layout type to use when fetching the view.
   */
  fetchView(viewId: t.ViewId, layout?: t.LayoutType): t.LayoutedView | Promise<t.LayoutedView>

  /**
   * Callback invoked when the view changes.
   */
  handleChange(viewId: t.ViewId, change: t.ViewChange): void | Promise<void>
}

export type LikeC4EditorProviderProps = PropsWithChildren<{ editor: LikeC4EditorPort }>

export const LikeC4EditorReactContext = createContext<LikeC4EditorPort | null>(null)

export function LikeC4EditorProvider({ children, editor }: LikeC4EditorProviderProps) {
  return <LikeC4EditorReactContext.Provider value={editor}>{children}</LikeC4EditorReactContext.Provider>
}

export function EnsureEditorContext({ children }: PropsWithChildren) {
  const ctx = useContext(LikeC4EditorReactContext)
  if (!ctx) {
    return null
  }

  return <>{children}</>
}

export function useOptionalLikeC4EditorPort() {
  return useContext(LikeC4EditorReactContext)
}
