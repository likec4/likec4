import type { Relation } from '@likec4/core'
import type { Edge as ReactFlowEdge } from '@xyflow/react'
import type { SetRequired } from 'type-fest'
import type { SharedTypes } from '../shared/xyflow/_types'
import type { AddNodeData } from '../../utils/types'

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

  type EdgeData = {
    relations: [Relation, ...Relation[]]
    existsInCurrentView: boolean
    hovered?: boolean
    dimmed?: 'immediate' | boolean
  }

  export type Edge = SetRequired<ReactFlowEdge<EdgeData, 'relation'>, 'data' | 'type'>
}
