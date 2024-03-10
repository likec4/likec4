import type { DiagramView, Opaque } from '@likec4/core'

export type DotSource = Opaque<string, 'DotSource'>

export type DotLayoutResult = {
  dot: DotSource
  diagram: DiagramView
}
