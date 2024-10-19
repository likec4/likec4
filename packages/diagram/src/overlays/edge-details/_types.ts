import type { ComputedNode, Fqn, Relation, ViewID } from '@likec4/core'
import type { Edge as ReactFlowEdge, Node as ReactFlowNode, ReactFlowInstance } from '@xyflow/react'
import type { SetRequired } from 'type-fest'

export namespace XYFlowTypes {
  type NodeProps = {
    fqn: Fqn
    element: Pick<ComputedNode, 'color' | 'title' | 'description' | 'shape' | 'kind'>
    ports: {
      in: string[]
      out: string[]
    }
    navigateTo: ViewID | null
    hovered?: boolean
    /**
     * Whether the node is dimmed
     * 'immediate' means that the node is dimmed without delay
     */
    dimmed?: 'immediate' | boolean
  }

  export type ElementNode = SetRequired<ReactFlowNode<NodeProps, 'element'>, 'type'>

  export type CompoundNode = SetRequired<ReactFlowNode<NodeProps, 'compound'>, 'type'>

  export type Node = ElementNode | CompoundNode

  export type Edge = Omit<ReactFlowEdge, 'data' | 'type'> & {
    data: {
      relation: Relation
      hovered?: boolean
      dimmed?: boolean
    }
    type: 'relation'
  }

  export type Instance = ReactFlowInstance<Node, Edge>
}
