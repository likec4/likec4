import type { AbstractRelation, ComputedNode, Fqn, ViewId } from '@likec4/core'
import type { Edge as ReactFlowEdge, Node as ReactFlowNode } from '@xyflow/react'
import type { SetRequired } from 'type-fest'

export namespace SharedFlowTypes {
  export type EmptyNodeData = {
    /**
     * Whether the cursor is hovering over the node
     */
    hovered?: boolean
    /**
     * Whether the node is currently leaving the overlay
     */
    leaving?: boolean
    /**
     * Whether the node is currently entering the overlay
     * @default true
     */
    entering?: boolean
    /**
     * Whether the node is dimmed
     * 'immediate' means that the node is dimmed without delay
     */
    dimmed?: 'immediate' | boolean
  }

  export type NonEmptyNodeData = EmptyNodeData & {
    /**
     * The node's fully qualified name
     */
    fqn: Fqn
  }

  export type OverlayNodeData = NonEmptyNodeData & {
    /**
     * The ComputedNode backing this node
     */
    element: Pick<ComputedNode, 'color' | 'title' | 'description' | 'shape' | 'kind'>
    /**
     * The node's incoming and outgoing ports
     */
    ports: {
      in: string[]
      out: string[]
    }
    /**
     * The id of the view that should be navigated to when clicking the navigate button
     */
    navigateTo: ViewId | null
    /**
     * The node's visual depth on the screen, 1 being the highest
     */
    depth?: number
  }

  export type ElementNode = SetRequired<ReactFlowNode<OverlayNodeData, 'element'>, 'type'>

  export type CompoundNode = SetRequired<ReactFlowNode<OverlayNodeData, 'compound'>, 'type'>

  export type NonEmptyNode = ElementNode | CompoundNode

  export type EmptyNode = SetRequired<ReactFlowNode<EmptyNodeData, 'empty'>, 'type'>

  export type Node = NonEmptyNode | EmptyNode

  export type EdgeData = {
    /**
     * The model's relations represented by this edge
     */
    relations: [AbstractRelation, ...AbstractRelation[]]
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
     * The id of the view that should be navigated to when clicking the edge
     */
    navigateTo?: ViewId | null
  }

  export type Edge = SetRequired<ReactFlowEdge<EdgeData, 'relation'>, 'data' | 'type'>
}
