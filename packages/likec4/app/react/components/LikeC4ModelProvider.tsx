import { LikeC4ModelProvider as LikeC4ModelProviderLib } from '@likec4/diagram'
import type { PropsWithChildren } from 'react'

export type LikeC4ModelProviderProps = PropsWithChildren<{
  // TODO: refer to 'likec4/model'
  likec4model: any
}>

/**
 * Ensures LikeC4Model context
 */
export function LikeC4ModelProvider({
  children,
  likec4model,
}: LikeC4ModelProviderProps) {
  return (
    <LikeC4ModelProviderLib likec4model={likec4model}>
      {children}
    </LikeC4ModelProviderLib>
  )
}
