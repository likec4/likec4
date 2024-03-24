declare module 'virtual:likec4' {
  import type { MapStore } from 'nanostores'
  import type { DiagramView } from '@likec4/core'

  export const $views: MapStore<Record<string, DiagramView>>
  export function useLikeC4View(id: string): DiagramView | null
}

declare module 'virtual:likec4/views' {
  import type { DiagramView } from '@likec4/core'

  export const LikeC4Views: Record<string, DiagramView>
}

declare module 'virtual:likec4/dimensions' {
  interface DiagramViewDimensions {
    width: number
    height: number
  }

  export const LikeC4Views: Record<string, DiagramViewDimensions>
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
