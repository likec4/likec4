import type { LikeC4Model } from '@likec4/core/model'
import type { Any, Unknown } from '@likec4/core/types'
import { type PropsWithChildren } from 'react'
import { LikeC4ModelContext } from './likec4model/LikeC4ModelContext'

export type LikeC4ModelProviderProps<A extends Any> = PropsWithChildren<{
  likec4model: LikeC4Model<A>
}>

/**
 * Ensures LikeC4Model context
 */
export function LikeC4ModelProvider<A extends Any = Unknown>({
  children,
  likec4model,
}: LikeC4ModelProviderProps<A>) {
  return (
    <LikeC4ModelContext.Provider value={likec4model}>
      {children}
    </LikeC4ModelContext.Provider>
  )
}
