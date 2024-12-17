import { LikeC4Model } from '@likec4/core/model'

/**
 * We need this function to bundle LikeC4Model with `likec4/react'
 * Used by vite plugin to generate `virtual:likec4/model`
 */
export function createLikeC4Model(model: any): LikeC4Model {
  return LikeC4Model.create(model) as LikeC4Model
}

export { LikeC4Model } from '@likec4/core/model'
