import { LikeC4ModelProvider as LikeC4ModelProviderLib } from '@likec4/diagram'
import type { JSX, PropsWithChildren } from 'react'

export type LikeC4ModelProviderProps = PropsWithChildren<{
  // TODO: refer to 'likec4/model'
  likec4model: any
}>

export const LikeC4ModelProvider: (props: LikeC4ModelProviderProps) => JSX.Element = LikeC4ModelProviderLib
