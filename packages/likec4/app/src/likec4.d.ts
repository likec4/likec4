declare module 'virtual:likec4/views' {
  import type { DiagramView, ViewID } from '@likec4/core'

  export const LikeC4Views: Record<LikeC4ViewId, DiagramView>
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
