import type { LikeC4Model, LikeC4ViewModel } from '@likec4/core/model'
import type * as t from '@likec4/core/types'
import type { DiagramView } from '@likec4/core/types'
import { type PropsWithChildren, createContext, useContext } from 'react'

type UnknownLayouted = t.aux.UnknownLayouted

export const LikeC4ModelContext = createContext<LikeC4Model<any> | null>(null)

export type CurrentViewModel = LikeC4ViewModel<UnknownLayouted, DiagramView<UnknownLayouted>>
export const CurrentViewModelContext = createContext<CurrentViewModel | null>(null)

export function EnsureCurrentViewModel({ children }: PropsWithChildren) {
  const viewmodel = useContext(CurrentViewModelContext)
  if (!viewmodel) {
    return null
  }
  return <>{children}</>
}
