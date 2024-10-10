import type { LikeC4Model } from '@likec4/core'
import { type PropsWithChildren } from 'react'
import { LikeC4ModelContext } from './likec4model/LikeC4ModelContext'

export type LikeC4ModelProviderProps = PropsWithChildren<{
  likec4model: LikeC4Model
}>

/**
 * Ensures LikeC4Model context
 */
export function LikeC4ModelProvider({
  children,
  likec4model
}: LikeC4ModelProviderProps) {
  return (
    <LikeC4ModelContext.Provider value={likec4model}>
      {children}
    </LikeC4ModelContext.Provider>
  )
}
