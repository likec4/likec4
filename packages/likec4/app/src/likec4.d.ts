declare module '~likec4' {
  import type { DiagramView } from '@likec4/core'

  export const LikeC4Views: Record<string, DiagramView>
}

declare module '~likec4-dimensions' {
  interface DiagramViewDimensions {
    width: number
    height: number
  }

  export const LikeC4Views: Record<string, DiagramViewDimensions>
}
