import { LikeC4Model, type ViewID } from '@likec4/core'
import { createContext, useContext } from 'react'

export const LikeC4ModelContext = createContext({} as LikeC4Model.Layouted)

export function useLikeC4Model() {
  return useContext(LikeC4ModelContext)
}

export function useLikeC4ViewModel(viewId: ViewID) {
  return useLikeC4Model().view(viewId)
}
