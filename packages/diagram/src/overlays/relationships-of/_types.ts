import type { Node as ReactFlowNode } from '@xyflow/react'
import type { SetRequired } from 'type-fest'
import type { BaseTypes } from '../shared/_types'

export namespace RelationshipsOfTypes {

  type RelationshipsOfNodeData = {
    column: 'incomers' | 'subjects' | 'outgoers'
  }

  type NodeProps = RelationshipsOfNodeData & BaseTypes.NodeData

  export type ElementNode = SetRequired<ReactFlowNode<NodeProps, 'element'>, 'type'>

  export type CompoundNode = SetRequired<ReactFlowNode<NodeProps, 'compound'>, 'type'>

  export type NonEmptyNode = ElementNode | CompoundNode

  type EmptyNodeData = BaseTypes.EmptyNodeData & RelationshipsOfNodeData;

  export type EmptyNode = SetRequired<ReactFlowNode<EmptyNodeData, 'empty'>, 'type'>

  export type Node = NonEmptyNode | EmptyNode
}
