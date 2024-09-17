import { type LayoutedLikeC4Model, LikeC4Model } from '@likec4/core'

// export {
//   LikeC4ModelProvider,
//   useLikeC4Model,
//   useLikeC4View,
//   useLikeC4ViewModel,
//   useLikeC4Views
// } from '@likec4/diagram'

export function createLikeC4Model(model: LayoutedLikeC4Model): LikeC4Model.Layouted {
  return LikeC4Model.layouted(model)
}

export type { LikeC4Model } from '@likec4/core'

// export type LikeC4ModelLayouted = LikeC4Model.Layouted
// export type LikeC4ViewModelLayouted = LikeC4Model.Layouted
