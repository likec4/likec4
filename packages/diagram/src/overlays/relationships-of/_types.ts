import type { Node as ReactFlowNode } from '@xyflow/react'
import type { SetRequired } from 'type-fest'
import type { BaseTypes } from '../../xyflow/_types'

export namespace RelationshipsOfTypes {

  type RelationshipsOfNodeProps = {
    column: 'incomers' | 'subjects' | 'outgoers'
  }

  type NodeProps = RelationshipsOfNodeProps & BaseTypes.NodeProps

  export type ElementNode = SetRequired<ReactFlowNode<NodeProps, 'element'>, 'type'>

  export type CompoundNode = SetRequired<ReactFlowNode<NodeProps, 'compound'>, 'type'>

  export type NonEmptyNode = ElementNode | CompoundNode

  type EmptyNodeProps = BaseTypes.EmptyNodeProps & RelationshipsOfNodeProps;

  export type EmptyNode = SetRequired<ReactFlowNode<EmptyNodeProps, 'empty'>, 'type'>

  export type Node = NonEmptyNode | EmptyNode
}
