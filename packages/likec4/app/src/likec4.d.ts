declare module '~likec4' {
  import type { DiagramView, ViewID } from '@likec4/core'

  export type { ViewID }

  export const LikeC4Views: Record<LikeC4ViewId, DiagramView>
}

declare module '~likec4-dimensions' {
  interface DiagramViewDimensions {
    width: number
    height: number
  }

  export const LikeC4Views: Record<string, DiagramViewDimensions>
}

declare module '~likec4-dot-sources' {
  import type { FC } from 'react'
  export function dotSource(viewId: string): string
  export const DotSource: FC<{ viewId: string }>
}
declare module '~likec4-d2-sources' {
  import type { FC } from 'react'
  export function d2Source(viewId: string): string
  export const D2Source: FC<{ viewId: string }>
}
declare module '~likec4-mmd-sources' {
  import type { FC } from 'react'
  export function mmdSource(viewId: string): string
  export const MmdSource: FC<{ viewId: string }>
}
