import type { ColorLiteral } from './theme'
import type { ComputedEdge, ComputedNode, ComputedView } from './computed-view'

export type Point = [x: number, y: number]

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
  labels: DiagramLabel[]
}

export interface DiagramView extends Omit<ComputedView, 'nodes' | 'edges'> {
  readonly nodes: DiagramNode[]
  readonly edges: DiagramEdge[]
  width: number
  height: number
}
