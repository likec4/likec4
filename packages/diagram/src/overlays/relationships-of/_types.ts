import type { ComputedNode, Fqn, Relation, ViewId } from '@likec4/core'
import type {
  Edge as ReactFlowEdge,
  InternalNode as ReactFlowInternalNode,
  Node as ReactFlowNode,
  ReactFlowInstance
} from '@xyflow/react'
import type { SetRequired } from 'type-fest'

export namespace XYFlowTypes {
  /**
   * Handle in ReactFlow terms
   */
  export type Port = {
    id: string
    type: 'in' | 'out'
  }

  type NodeData = {
    depth?: number
    column: 'incomers' | 'subjects' | 'outgoers'
    fqn: Fqn
    existsInCurrentView: boolean
    element: Pick<ComputedNode, 'color' | 'title' | 'description' | 'shape' | 'kind'>
    ports: {
      left: Port[]
      right: Port[]
    }
    navigateTo: ViewId | null
    hovered?: boolean
    layoutId?: string
    leaving?: boolean
    /**
     * @default true
     */
    entering?: boolean
    /**
     * Whether the node is dimmed
     * 'immediate' means that the node is dimmed without delay
     */
    dimmed?: 'immediate' | boolean
  }

  export type ElementNode = SetRequired<ReactFlowNode<NodeData, 'element'>, 'type'>

  export type CompoundNode = SetRequired<ReactFlowNode<NodeData, 'compound'>, 'type'>

  export type NonEmptyNode = ElementNode | CompoundNode

  type EmptyNodeData = {
    column: 'incomers' | 'subjects' | 'outgoers'
    hovered?: boolean
    dimmed?: boolean
    /**
     * @default true
     */
    entering?: boolean
  };

  export type EmptyNode = SetRequired<ReactFlowNode<EmptyNodeData, 'empty'>, 'type'>

  export type Node = NonEmptyNode | EmptyNode

  type EdgeData = {
    relations: [Relation, ...Relation[]]
    includedInCurrentView: boolean
    hovered?: boolean
    dimmed?: 'immediate' | boolean
  }

  export type Edge = SetRequired<ReactFlowEdge<EdgeData, 'relation'>, 'data' | 'type'>;

  export type Instance = ReactFlowInstance<Node, Edge>

  export type InternalNode = ReactFlowInternalNode<Node>
}
