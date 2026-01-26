import { type PropsWithChildren, createContext, useContext } from 'react'
import type { LikeC4EditorCallbacks } from './LikeC4EditorCallbacks'

export type LikeC4EditorProviderProps = PropsWithChildren<{ editor: LikeC4EditorCallbacks }>

const LikeC4EditorReactContext = createContext<LikeC4EditorCallbacks | null>(null)

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
export function LikeC4EditorProvider({ children, editor }: LikeC4EditorProviderProps) {
  return <LikeC4EditorReactContext.Provider value={editor}>{children}</LikeC4EditorReactContext.Provider>
}

/**
 * Component that ensures the editor context is available.
 *
 * @param children - The children to render.
 */
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
