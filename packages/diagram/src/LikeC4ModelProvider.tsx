import { LikeC4Model } from '@likec4/core'
import { type PropsWithChildren } from 'react'
import { LikeC4ModelContext } from './likec4model'

export type LikeC4ModelProviderProps = PropsWithChildren<{
  likec4model: LikeC4Model.Layouted
}>

export function LikeC4ModelProvider({
  likec4model,
  children
}: LikeC4ModelProviderProps) {
  return (
    <LikeC4ModelContext.Provider value={likec4model}>
      {children}
    </LikeC4ModelContext.Provider>
  )
}
