import { type LayoutedLikeC4Model, LikeC4Model } from '@likec4/core'

/**
 * We need this function to bundle LikeC4Model with `likec4/react'
 * Used by vite plugin to generate `virtual:likec4/model`
 */
export function createLikeC4Model(model: LayoutedLikeC4Model): LikeC4Model.Layouted {
  return LikeC4Model.create(model)
}

export { LikeC4Model } from '@likec4/core'
