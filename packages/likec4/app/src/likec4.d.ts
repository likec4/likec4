declare module 'virtual:likec4/store' {
  import type { MapStore } from 'nanostores'
  import type { DiagramView, LikeC4ViewId } from 'virtual:likec4/views'

  export const $views: MapStore<Record<string, DiagramView>>

  export function useLikeC4Views(): Record<string, DiagramView>
  export function useLikeC4View(viewId: string): DiagramView | null
}

declare module 'likec4' {
  import type { DiagramView } from '@likec4/core'

  export type { DiagramView }
}

declare module 'virtual:likec4/views' {
  import type { Tagged } from 'type-fest'
  import type { DiagramView as CoreDiagramView, Tag, ViewID } from '@likec4/core'

  export type LikeC4ViewId = Tagged<string, 'ViewID'>

  export type LikeC4Tag = Tagged<string, 'Tag'>

  export type LikeC4ElementKind = Tagged<string, 'ElementKind'>

  export type DiagramView<ViewId extends string = LikeC4ViewId> = Omit<CoreDiagramView, 'id'> & {
    id: ViewId
  }

  export type LikeC4Views = Record<LikeC4ViewId, DiagramView<LikeC4ViewId>>

  export const LikeC4Views: LikeC4Views
  export function isLikeC4ViewId(value: unknown): value is LikeC4ViewId
}

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
  import type { OverviewGraph as CoreOverviewGraph } from '@likec4/core'
  export type OverviewGraph = CoreOverviewGraph
  export function useOverviewGraph(): OverviewGraph
}

declare module 'virtual:likec4/previews' {
  export function usePreviewUrl(viewId: string): string | null
}

declare module 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs' {
  import mermaid from 'mermaid'
  export default mermaid
}
