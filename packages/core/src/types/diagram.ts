import type { ColorLiteral } from './theme'
import type { ComputedEdge, ComputedNode, ComputedView } from './computed-view'
import type { NonEmptyArray } from './_common'

export type Point = [x: number, y: number]

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
  size: {
    width: number
    height: number
  }
  labels: DiagramLabel[]
  position: Point // Absolute position, top left
  // relative: Point // Top left, relative to parent
  depth?: number
}

export interface DiagramEdge extends ComputedEdge {
  points: Point[]
  // Polygons are used to draw arrows
  headArrow?: Point[]
  labels?: NonEmptyArray<DiagramLabel>
  labelBBox?: BBox
}

export interface DiagramView extends Omit<ComputedView, 'nodes' | 'edges'> {
  readonly nodes: DiagramNode[]
  readonly edges: DiagramEdge[]
  readonly width: number
  readonly height: number
}
