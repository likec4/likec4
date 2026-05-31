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

export interface SequenceFrameBranch {
  label?: string | undefined
  condition?: string | undefined
  /** Row index of the first step in this branch */
  rowStart: number
  /** Row index of the last step in this branch */
  rowEnd: number
  /** Y-midpoint separators between this branch and the next (empty for the last branch) */
  separatorYs: ReadonlyArray<number>
}

export interface SequenceFrame {
  id: string
  kind: 'if' | 'optional' | 'repeat' | 'parallel' | 'group' | 'critical' | 'break'
  label?: string | undefined
  condition?: string | undefined
  depth: number
  parent?: string | undefined
  x: number
  y: number
  width: number
  height: number
  branches: ReadonlyArray<SequenceFrameBranch>
}

export interface SequenceActivation {
  actor: NodeId
  startStepId: EdgeId | null
  endStepId: EdgeId | null
  startY: number
  endY: number
  depth: number
}

export interface SequenceNote {
  id: string
  placement: 'over' | 'left' | 'right'
  actors: ReadonlyArray<NodeId>
  text: string
  x: number
  y: number
  width: number
  height: number
  afterStepId: EdgeId | null
}

export interface SequenceViewLayout {
  id: ViewId
  actors: Array<SequenceActor>
  compounds: Array<SequenceCompound>
  /** @deprecated use frames instead; kept for back-compat with WI-8 renderer */
  parallelAreas: Array<SequenceParallelArea>
  frames: Array<SequenceFrame>
  activations: Array<SequenceActivation>
  notes: Array<SequenceNote>
  bounds: BBox
}
