import type { ComputedEdge, ComputedNode, ComputedView } from './computed-view'

export type Point = [x: number, y: number]

export interface DiagramNode extends ComputedNode {
  size: {
    width: number
    height: number
  }
  position: Point // Absolute position, top left
  relative: Point // Top left, relative to parent
}

export interface DiagramEdge extends ComputedEdge {
  points: Point[]
  // Polygons are used to draw arrows
  headArrow?: Point[]
  labelBox: {
    x: number
    y: number
    width: number
    height?: number
    align?: 'left' | 'right' | 'center'
  } | null
}

export interface DiagramView extends ComputedView<DiagramNode, DiagramEdge> {
  width: number
  height: number
}
