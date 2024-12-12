import type { ComputedNode, Fqn, Relation, ViewId } from "@likec4/core"
import type { Edge as ReactFlowEdge, Node as ReactFlowNode } from '@xyflow/react'
import type { SetRequired } from "type-fest"

export namespace BaseTypes {

  /**
   * Handle in ReactFlow terms
   */
  export type Port = {
    id: string
    type: 'in' | 'out'
  }

  export type EmptyNodeData = {
    /**
     * The id of the layout the node belongs to
     */
    layoutId?: string
    /**
     * Whether the cursor is hovering over the node
     */
    hovered?: boolean
    /**
     * Whether the node is dimmed
     * 'immediate' means that the node is dimmed without delay
     */
    dimmed?: 'immediate' | boolean
    /**
     * Whether the node is currently entering the screen
     */
    entering?: boolean
    /**
     * Whether the node is currently leaving the screen
     */
    leaving?: boolean
  }

  export type NodeData = EmptyNodeData & {
    fqn: Fqn
    element: Pick<ComputedNode, 'color' | 'title' | 'description' | 'shape' | 'kind'>
    ports: {
      in: Port[]
      out: Port[]
    }
    navigateTo: ViewId | null
    /**
     * The visual depth of the node on the screen, 0 being the highest
     */
    depth?: number,
  }

  export type ElementNode = SetRequired<ReactFlowNode<NodeData, 'element'>, 'type'>

  export type CompoundNode = SetRequired<ReactFlowNode<NodeData, 'compound'>, 'type'>

  export type NonEmptyNode = ElementNode | CompoundNode

  export type EdgeData = {
    relations: [Relation, ...Relation[]]
    /**
     * Whether the edge is explicitly included in the current view
     */
    includedInCurrentView: boolean
    /**
     * Whether the cursor is hovering over the edge
     */
    hovered?: boolean
    /**
     * Whether the edge is dimmed
     * 'immediate' means that the node is dimmed without delay
     */
    dimmed?: 'immediate' | boolean
  };

  export type Edge = SetRequired<ReactFlowEdge<EdgeData, 'relation'>, 'data' | 'type'>
}
