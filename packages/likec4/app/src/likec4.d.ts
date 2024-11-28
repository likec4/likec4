declare module 'virtual:likec4/dot-sources' {
  export function dotSource(viewId: string): string

  export function svgSource(viewId: string): string
}
declare module 'virtual:likec4/d2-sources' {
  export function d2Source(viewId: string): string
}
declare module 'virtual:likec4/mmd-sources' {
  export function mmdSource(viewId: string): string
}
declare module 'virtual:likec4/icons' {
  import type { JSX } from 'react'
  export const Icons: Record<string, () => JSX.Element>
}

declare module 'virtual:likec4/overview-graph' {
  import type { OverviewGraph as CoreOverviewGraph, ViewId } from '@likec4/core'
  export type OverviewGraph = CoreOverviewGraph
  export function useOverviewGraph(): OverviewGraph
}

declare module 'virtual:likec4/previews' {
  export function usePreviewUrl(viewId: string): string | null
}

declare module 'virtual:likec4/model' {
  import type { LikeC4Model } from '@likec4/core'
  import type { DiagramView as CoreDiagramView } from '@likec4/core'
  import type { ReadableAtom } from 'nanostores'

  export type LikeC4ViewId = 'likec4-view-id'

  export type LikeC4Tag = 'likec4-tag'

  export type LikeC4ElementKind = 'likec4-element-kind'

  export type DiagramView<ViewId extends LikeC4ViewId = LikeC4ViewId> = Omit<CoreDiagramView, 'id'> & {
    id: ViewId
  }

  export const LikeC4Views: Record<LikeC4ViewId, DiagramView>

  export const likeC4Model: LikeC4Model.Layouted

  export function useLikeC4Model(): LikeC4Model.Layouted
}

declare module 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs' {
  import mermaid from 'mermaid'
  export default mermaid
}
