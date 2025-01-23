import type { AddEdgeData, AddNodeData } from '../../utils/types'
import type { SharedFlowTypes } from '../shared/xyflow/_types'

export namespace RelationshipsOfFlowTypes {
  /**
   * Data that is exclusive to the relationships-of overlay. It will be merged into the node types
   * provided by SharedFlowTypes.
   */
  type RelationshipsOfNodeData = {
    depth?: number
    column: 'incomers' | 'subjects' | 'outgoers'
    existsInCurrentView: boolean
    layoutId?: string
  }

  // Extend the node types provided by SharedFlowTypes with RelationshipsOfNodeData

  export type ElementNode = AddNodeData<SharedFlowTypes.ElementNode, RelationshipsOfNodeData>

  export type CompoundNode = AddNodeData<SharedFlowTypes.CompoundNode, RelationshipsOfNodeData>

  export type NonEmptyNode = ElementNode | CompoundNode

  export type EmptyNode = AddNodeData<SharedFlowTypes.EmptyNode, RelationshipsOfNodeData>

  export type Node = NonEmptyNode | EmptyNode

  /**
   * Data that is exclusive to the relationships-of overlay. It will be merged into the edge types
   * provided by SharedFlowTypes.
   */
  type RelationshipsOfEdgeData = {
    existsInCurrentView: boolean
  }

  // Extend the edge types provided by SharedFlowTypes with RelationshipsOfEdgeData

  export type Edge = AddEdgeData<SharedFlowTypes.Edge, RelationshipsOfEdgeData>
}
