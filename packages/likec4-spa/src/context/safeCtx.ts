import type { LikeC4Model } from '@likec4/core/model'
import type { ProjectId } from '@likec4/core/types'
import type { ProjectDiffs } from 'likec4:diffs'
import type { ReadableAtom } from 'nanostores'
import type { LikeC4ViewContextValue } from './LikeC4ViewContext'
import { createContext, useContext } from 'react'

/**
 * To improve experience with HMR, contexts live in a separate file and act as a boundary for hooks
 */

/**
 * The project the user is in: its model and diffs, as atoms
 */
export interface LikeC4ProjectContextValue {
  projectId: ProjectId
  $model: ReadableAtom<LikeC4Model.Layouted>
  $diffs: ReadableAtom<ProjectDiffs>
}

export const LikeC4ProjectCtx = createContext<LikeC4ProjectContextValue | null>(null)
LikeC4ProjectCtx.displayName = 'LikeC4ProjectContext'

/**
 * @throws If called outside of `LikeC4ProjectContext`
 */
export function useLikeC4ProjectContext(): LikeC4ProjectContextValue {
  const ctx = useContext(LikeC4ProjectCtx)
  if (ctx === null) {
    throw new Error('LikeC4ProjectContext is not provided')
  }
  return ctx
}

export const LikeC4ViewCtx = createContext<LikeC4ViewContextValue | null>(null)
LikeC4ViewCtx.displayName = 'LikeC4ViewContext'

/**
 * @throws If called outside of `LikeC4ViewContext`
 */
export function useLikeC4ViewContext(): LikeC4ViewContextValue {
  const ctx = useContext(LikeC4ViewCtx)
  if (ctx === null) {
    throw new Error('LikeC4ViewContext is not provided')
  }
  return ctx
}

/**
 * @returns The view context, or null outside of a view (for example, on the project index page)
 */
export function useOptionalLikeC4ViewContext(): LikeC4ViewContextValue | null {
  return useContext(LikeC4ViewCtx)
}
