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
  import type { OverviewGraph as CoreOverviewGraph, ViewID } from '@likec4/core'
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
  // import type { DiagramView as CoreDiagramView, LikeC4Model } from 'likec4/react'
  import type { Tagged } from 'type-fest'

  export type LikeC4ViewId = Tagged<string, 'ViewID'>

  export type LikeC4Tag = Tagged<string, 'Tag'>

  export type LikeC4ElementKind = Tagged<string, 'ElementKind'>

  export type DiagramView<ViewId extends string = LikeC4ViewId> = Omit<CoreDiagramView, 'id'> & {
    id: ViewId
  }

  export const LikeC4Views: Record<ViewID, DiagramView>

  export const likec4model: LikeC4Model.Layouted

  export const $likec4model: ReadableAtom<LikeC4Model.Layouted>

  export function useLikeC4ModelAtom(): LikeC4Model.Layouted
}

declare module 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs' {
  import mermaid from 'mermaid'
  export default mermaid
}
