// declare module 'virtual:likec4/projects' {
//   import type { NonEmptyReadonlyArray, ProjectId } from '@likec4/core'
//   export const isSingleProject: boolean
//   export const projects: NonEmptyReadonlyArray<ProjectId>
// }

import 'likec4/model'

// declare module 'virtual:likec4/dot-sources/*.js' {
//   export function dotSource(viewId: string): string

//   export function svgSource(viewId: string): string
// }
// declare module 'virtual:likec4/d2-sources/*' {
//   export function d2Source(viewId: string): string
// }
// declare module 'virtual:likec4/mmd-sources/*' {
//   export function mmdSource(viewId: string): string
// }
// declare module 'virtual:likec4/icons/*' {
//   import type { JSX } from 'react'
//   export const Icons: Record<string, () => JSX.Element>
// }

// declare module 'virtual:likec4/overview-graph/*' {
//   import type { OverviewGraph as CoreOverviewGraph } from '@likec4/core'
//   export type OverviewGraph = CoreOverviewGraph
//   export function useOverviewGraph(): OverviewGraph
// }

// declare module 'virtual:likec4/previews' {
//   export function usePreviewUrl(viewId: string): string | null
// }

// declare module 'virtual:likec4/model' {
//   import type { LikeC4Model } from '@likec4/core'

//   export function loadModel(projectId: string): Promise<{
//     likeC4Model: LikeC4Model.Layouted
//     useLikeC4Model(): LikeC4Model.Layouted
//   }>
// }

declare module 'likec4/model' {
  import { aux } from '@likec4/core/types'

  export { LikeC4Model } from '@likec4/core/model'
  export type * from '@likec4/core/types'
  export type UnknownLayouted = aux.UnknownLayouted
}
// declare module 'virtual:likec4/model/*.js' {
//   import type { DiagramView as CoreDiagramView, LikeC4Model } from '@likec4/core'

//   export type LikeC4ViewId = 'likec4-view-id'

//   export type LikeC4Tag = 'likec4-tag'

//   export type LikeC4ElementKind = 'likec4-element-kind'

//   export type DiagramView<ViewId extends LikeC4ViewId = LikeC4ViewId> = CoreDiagramView<ViewId>

//   export const LikeC4Views: Record<LikeC4ViewId, DiagramView>

//   export const likeC4Model: LikeC4Model.Layouted

//   export function useLikeC4Model(): LikeC4Model.Layouted
// }
