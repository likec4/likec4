import type { BBox, DiagramEdge, DiagramNode, EdgeId, NodeId, ViewId } from '@likec4/core/types'

export type Step = {
  id: EdgeId
  from: {
    column: number
    row: number
  }
  to: {
    column: number
    row: number
  }
  source: DiagramNode
  target: DiagramNode
  label: null | {
    height: number
    width: number
    text: string | null
  }
  isSelfLoop: boolean
  isBack: boolean
  parallelPrefix: string | null
  offset: number // offset for continuing edges
  edge: DiagramEdge
}

export type Compound = {
  node: DiagramNode
  from: DiagramNode
  to: DiagramNode

  nested: Compound[]
}

export type ParallelRect = {
  parallelPrefix: string
  min: {
    column: number
    row: number
  }
  max: {
    column: number
    row: number
  }
}

export interface SequenceActorStepPort {
  id: string
  cx: number // center x
  cy: number // center y
  height: number
  type: 'target' | 'source'
  position: 'left' | 'right' | 'top' | 'bottom'
}

export interface SequenceActor {
  id: NodeId
  x: number
  y: number
  width: number
  height: number
  ports: Array<SequenceActorStepPort>
}

export interface SequenceCompound {
  id: NodeId // auto-generated
  origin: NodeId
  x: number
  y: number
  width: number
  height: number
  depth: number
}

export interface SequenceParallelArea {
  parallelPrefix: string
  x: number
  y: number
  width: number
  height: number
}

export interface SequenceViewLayout {
  id: ViewId
  actors: Array<SequenceActor>
  compounds: Array<SequenceCompound>
  parallelAreas: Array<SequenceParallelArea>
  bounds: BBox
}
