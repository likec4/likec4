import type { DiagramEdge, DiagramNode, EdgeId } from '@likec4/core/types'

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
  branchId?: string
  branchLabel?: string | null
  pathId?: string
  pathIndex?: number
  pathName?: string | null
  pathTitle?: string | null
  kind?: 'parallel' | 'alternate'
  isDefaultPath?: boolean
  min: {
    column: number
    row: number
  }
  max: {
    column: number
    row: number
  }
}
