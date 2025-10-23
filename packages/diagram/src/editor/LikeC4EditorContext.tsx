import type * as t from '@likec4/core/types'
import { type PropsWithChildren, createContext, useContext } from 'react'
import type { OnChange } from '../LikeC4Diagram.props'

export type LikeC4EditorContextType = {
  /**
   * Fetch a view by its ID and layout type.
   *
   * @param viewId - The ID of the view to fetch.
   * @param layout - The layout type to use when fetching the view.
   */
  fetchView(viewId: t.ViewId, layout?: t.LayoutType): Promise<t.LayoutedView>

  syncManualLayout(viewId: t.ViewId): Promise<void>

  /**
   * Callback invoked when the view changes.
   */
  onChange: OnChange
}

const LikeC4EditorReactContext = createContext<LikeC4EditorContextType | null>(null)

export function LikeC4EditorContext({ children }: PropsWithChildren) {
  const contextValue: LikeC4EditorContextType = {} as any

  return <LikeC4EditorReactContext.Provider value={contextValue}>{children}</LikeC4EditorReactContext.Provider>
}

export function EnsureEditorContext({ children }: PropsWithChildren) {
  const ctx = useContext(LikeC4EditorReactContext)
  if (!ctx) {
    return null
  }

  return <>{children}</>
}

export function useOptionalLikeC4Editor() {
  return useContext(LikeC4EditorReactContext)
}

export function useLikeC4Editor() {
  const ctx = useContext(LikeC4EditorReactContext)
  if (!ctx) {
    throw new Error('useLikeC4EditorContext must be used within a LikeC4EditorContextProvider')
  }
  return ctx
}
