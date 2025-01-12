import type { Edge as ReactFlowEdge, Node as ReactFlowNode, NodeProps as ReactFlowNodeProps } from '@xyflow/react'

/**
 * ReactFlow Custom Node properties with BaseNodeData at least
 */
export type NodeProps<T extends Record<string, unknown> = {}> = ReactFlowNodeProps<
  ReactFlowNode<BaseTypes.NodeData & T, any>
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

  // // export type NonEmptyNodeData = EmptyNodeData & {
  // //   /**
  // //    * The node's fully qualified name
  // //    */
  // //   fqn: Fqn
  // // }

  // // export type OverlayNodeData = NonEmptyNodeData & {
  // //   /**
  // //    * The ComputedNode backing this node
  // //    */
  // //   element: Pick<ComputedNode, 'color' | 'title' | 'description' | 'shape' | 'kind'>
  // //   /**
  // //    * The node's incoming and outgoing ports
  // //    */
  // //   ports: {
  // //     in: string[]
  // //     out: string[]
  // //   }
  // //   /**
  // //    * The id of the view that should be navigated to when clicking the navigate button
  // //    */
  // //   navigateTo: ViewId | null
  // //   /**
  // //    * The node's visual depth on the screen, 1 being the highest
  // //    */
  // //   depth?: number
  // // }

  // export type ElementData = Simplify<
  //   & NodeData
  //   & Pick<
  //     DiagramNode,
  //     | 'title'
  //     | 'technology'
  //     | 'description'
  //     | 'color'
  //     | 'shape'
  //     | 'width'
  //     | 'level'
  //     | 'height'
  //   >
  //   & {
  //     icon: string | null
  //   }
  // >
  // export type ElementNode = ReactFlowNode<ElementData, 'element'>

  // export type CompoundData = Simplify<
  //   & NodeData
  //   & Pick<
  //     DiagramNode,
  //     | 'title'
  //     | 'color'
  //     | 'shape'
  //     | 'style'
  //   >
  //   & {
  //     icon: string | null
  //     depth: number
  //   }
  // >

  // export type CompoundNode = ReactFlowNode<CompoundData, 'compound'>

  // export type Node = ElementNode | CompoundNode

  // export type EmptyNode = SetRequired<ReactFlowNode<EmptyNodeData, 'empty'>, 'type'>

  // export type Node = ReactFlowNode<ElementData, 'element'>

  export type EdgeData = {
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

  // export type Edge = SetRequired<ReactFlowEdge<EdgeData, 'relation'>, 'data' | 'type'>
  export type Edge = ReactFlowEdge<EdgeData>
}
