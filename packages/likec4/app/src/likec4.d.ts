declare module 'virtual:likec4' {
  import type { MapStore } from 'nanostores'
  import type { DiagramView } from '@likec4/core'

  export const $views: MapStore<Record<string, DiagramView>>
}

declare module 'virtual:likec4/views' {
  import type { DiagramView, ViewID } from '@likec4/core'

  export type LikeC4ViewId = ViewID

  export type LikeC4Views = Record<LikeC4ViewId, DiagramView>

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

declare module 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs' {
  import mermaid from 'mermaid'
  export default mermaid
}
