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

  type NodeProps = {
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
    initialAnimation?: boolean
    /**
     * Whether the node is dimmed
     * 'immediate' means that the node is dimmed without delay
     */
    dimmed?: 'immediate' | boolean
  }

  export type ElementNode = SetRequired<ReactFlowNode<NodeProps, 'element'>, 'type'>

  export type CompoundNode = SetRequired<ReactFlowNode<NodeProps, 'compound'>, 'type'>

  export type NonEmptyNode = ElementNode | CompoundNode

  export type EmptyNode = SetRequired<
    ReactFlowNode<{
      column: 'incomers' | 'subjects' | 'outgoers'
      hovered?: boolean
      dimmed?: boolean
      /**
       * @default true
       */
      initialAnimation?: boolean
    }, 'empty'>,
    'type'
  >

  export type Node = NonEmptyNode | EmptyNode

  export type Edge = Omit<ReactFlowEdge, 'data' | 'type'> & {
    data: {
      relations: [Relation, ...Relation[]]
      includedInCurrentView: boolean
      hovered?: boolean
      dimmed?: 'immediate' | boolean
    }
    type: 'relation'
  }

  export type Instance = ReactFlowInstance<Node, Edge>

  export type InternalNode = ReactFlowInternalNode<Node>
}
