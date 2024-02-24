import type { DiagramView, EdgeId, Fqn, Opaque } from '@likec4/core'

export type DotSource = Opaque<string, 'DotSource'>

export type DotLayoutResult = {
  dot: DotSource
  diagram: DiagramView
}

export type Point = [x: number, y: number]
