import type { LikeC4Model } from '@likec4/core/model'
import type { PropsWithChildren } from 'react'
import type { JSX } from 'react/jsx-runtime'
import { LikeC4ModelContextProvider } from './context/LikeC4ModelContext'

export interface LikeC4ModelProviderProps {
  likec4model: LikeC4Model<any>
}

/**
 * Ensures LikeC4Model context
 */
export function LikeC4ModelProvider({
  children,
  likec4model,
}: PropsWithChildren<LikeC4ModelProviderProps>): JSX.Element {
  return (
    <LikeC4ModelContextProvider value={likec4model}>
      {children}
    </LikeC4ModelContextProvider>
  )
}
