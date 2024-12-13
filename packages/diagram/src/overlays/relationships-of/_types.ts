import type { AddEdgeData, AddNodeData } from '../../utils/types'
import type { SharedTypes } from '../shared/xyflow/_types'

export namespace XYFlowTypes {
  type RelationshipsOfNodeData = {
    depth?: number
    column: 'incomers' | 'subjects' | 'outgoers'
    existsInCurrentView: boolean
    layoutId?: string
  }

  export type ElementNode = AddNodeData<SharedTypes.ElementNode, RelationshipsOfNodeData>

  export type CompoundNode = AddNodeData<SharedTypes.CompoundNode, RelationshipsOfNodeData>

  export type NonEmptyNode = ElementNode | CompoundNode

  export type EmptyNode = AddNodeData<SharedTypes.EmptyNode, RelationshipsOfNodeData>

  export type Node = NonEmptyNode | EmptyNode

  type RelationshipsOfEdgeData = {
    existsInCurrentView: boolean
  }

  export type Edge = AddEdgeData<SharedTypes.Edge, RelationshipsOfEdgeData>
}
