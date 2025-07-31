import type { LikeC4Model, LikeC4ViewModel } from '@likec4/core/model'
import type { aux, DiagramView } from '@likec4/core/types'
import { createContext } from 'react'

export const LikeC4ModelContext = createContext<LikeC4Model<any> | null>(null)

export type CurrentViewModel = LikeC4ViewModel<aux.UnknownLayouted, DiagramView<aux.UnknownLayouted>>
export const CurrentViewModelContext = createContext<CurrentViewModel | null>(null)
