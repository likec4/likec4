import type { NonEmptyArray } from './_common'
import type { ComputedEdge, ComputedNode, ComputedView } from './computed-view'
import type { ColorLiteral } from './theme'

export type Point = readonly [x: number, y: number]

// Bounding box
export type BBox = {
  x: number
  y: number
  width: number
  height: number
}

export interface DiagramLabel {
  align: 'left' | 'right' | 'center'
  fontStyle?: 'bold' | 'normal'
  color?: ColorLiteral
  fontSize: number
  pt: Point
  width: number
  text: string
}

export interface DiagramNode extends ComputedNode {
  width: number
  height: number
  position: Point // Absolute position, top left
  // relative: Point // Top left, relative to parent
  labels: DiagramLabel[]
}

export interface DiagramEdge extends ComputedEdge {
  points: NonEmptyArray<Point>
  // Polygons are used to draw arrows
  headArrow?: NonEmptyArray<Point>
  // Draw arrow from the last point of the edge to this point
  headArrowPoint?: Point
  tailArrow?: NonEmptyArray<Point>
  // Draw arrow from the first point of the edge to this point
  tailArrowPoint?: Point
  labels?: NonEmptyArray<DiagramLabel>
  labelBBox?: BBox
}

export interface DiagramView extends Omit<ComputedView, 'nodes' | 'edges'> {
  readonly nodes: DiagramNode[]
  readonly edges: DiagramEdge[]
  readonly width: number
  readonly height: number
}
