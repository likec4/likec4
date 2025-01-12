import type {
  Edge as ReactFlowEdge,
  EdgeProps as ReactFlowEdgeProps,
  Node as ReactFlowNode,
  NodeProps as ReactFlowNodeProps,
} from '@xyflow/react'
import type { SetRequired } from 'type-fest'

/**
 * ReactFlow Custom Node properties with BaseNodeData at least
 */
export type NodeProps<T extends Record<string, unknown> = {}> = ReactFlowNodeProps<
  ReactFlowNode<BaseTypes.NodeData & T, any>
>

/**
 * ReactFlow Custom Edge properties with BaseEdgeData at least
 */
export type EdgeProps<T extends Record<string, unknown> = {}> = SetRequired<
  ReactFlowEdgeProps<
    ReactFlowEdge<BaseTypes.EdgeData & T, any>
  >,
  'data'
>

export namespace BaseTypes {
  export type NodeData = {
    /**
     * Whether the cursor is hovering over the node
     */
    hovered?: boolean
    /**
     * Whether the node is dimmed
     * 'immediate' means that the node is dimmed without delay
     */
    dimmed?: 'immediate' | boolean
  }

  export type Node = ReactFlowNode<NodeData>

  export type EdgeData = {
    /**
     * Whether the cursor is hovering over the edge
     */
    hovered?: boolean
    /**
     * Whether the edge is active (animated and highlighted)
     */
    active?: boolean
    /**
     * Whether the edge is dimmed
     * 'immediate' means that the edge is dimmed without delay
     */
    dimmed?: 'immediate' | boolean
  }

  // export type Edge = SetRequired<ReactFlowEdge<EdgeData, 'relation'>, 'data' | 'type'>
  export type Edge = SetRequired<ReactFlowEdge<EdgeData>, 'data'>
}
