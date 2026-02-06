import type { LikeC4Model, LikeC4ViewModel } from '@likec4/core/model'
import type * as t from '@likec4/core/types'
import type { LayoutedView } from '@likec4/core/types'
import { type PropsWithChildren, createContext, useContext } from 'react'

type UnknownLayouted = t.aux.UnknownLayouted

const LikeC4ModelContext = createContext<LikeC4Model<any> | null>(null)
export const LikeC4ModelContextProvider = LikeC4ModelContext.Provider

export type CurrentViewModel = LikeC4ViewModel<UnknownLayouted, LayoutedView<UnknownLayouted>>

const CurrentViewModelCtx = createContext<CurrentViewModel | null>(null)
export const CurrentViewModelContext = CurrentViewModelCtx.Provider

export function EnsureCurrentViewModel({ children }: PropsWithChildren) {
  const viewmodel = useContext(CurrentViewModelCtx)
  if (!viewmodel) {
    return null
  }
  return <>{children}</>
}

/**
 * @returns The LikeC4Model from context, or null if no LikeC4ModelProvider is found.
 */
export function useOptionalLikeC4Model<A extends t.aux.Any = UnknownLayouted>(): LikeC4Model<A> | null {
  return useContext(LikeC4ModelContext)
}

export function useOptionalCurrentViewModel(): CurrentViewModel | null {
  return useContext(CurrentViewModelCtx)
}
