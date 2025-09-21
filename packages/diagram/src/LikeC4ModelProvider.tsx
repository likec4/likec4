import type { LikeC4Model } from '@likec4/core/model'
import type { aux } from '@likec4/core/types'
import { type PropsWithChildren } from 'react'
import { LikeC4ModelContext } from './context/LikeC4ModelContext'

export interface LikeC4ModelProviderProps<A extends aux.Any = aux.Unknown> {
  likec4model: LikeC4Model<A>
}

/**
 * Ensures LikeC4Model context
 */
export function LikeC4ModelProvider<A extends aux.Any = aux.Unknown>({
  children,
  likec4model,
}: PropsWithChildren<LikeC4ModelProviderProps<A>>) {
  return (
    <LikeC4ModelContext.Provider value={likec4model}>
      {children}
    </LikeC4ModelContext.Provider>
  )
}
