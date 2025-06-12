import { LikeC4Model } from '@likec4/core/model'
import type { LayoutedLikeC4ModelData, UnknownLayouted } from './model'

export * from './LikeC4'

/**
 * Used by vite plugin to generate `virtual:likec4/model`
 */
export function createLikeC4Model(model: any): LikeC4Model<UnknownLayouted> {
  return LikeC4Model.create(model as LayoutedLikeC4ModelData<UnknownLayouted>)
}

export type * from '@likec4/core/types'
