import type { ComputedEdge, ComputedNode } from './computed-view'
import type { ElementView } from './view'

export type Point = [x: number, y: number]

export interface DiagramNode extends ComputedNode {
  size: {
    width: number
    height: number
  },
  position: Point // Absolute position, top left
  relative: Point // Top left, relative to parent
}


export interface DiagramEdge extends ComputedEdge {
  points: Point[],
  labelBox: {
    x: number
    y: number
    width: number
    height?: number
    align?: 'left' | 'right' | 'center'
  } | null
}

export interface DiagramView extends ElementView {
  width: number
  height: number
  nodes: DiagramNode[]
  edges: DiagramEdge[]
}
