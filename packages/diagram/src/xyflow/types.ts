import type { BBox, DiagramEdge, DiagramNode, XYPoint } from '@likec4/core'
import type { Edge as ReactFlowEdge, InternalNode as ReactFlowInternalNode, Node as ReactFlowNode, ReactFlowInstance, ReactFlowState } from '@xyflow/react'
import type { SetRequired, Simplify } from 'type-fest'
import type { SharedFlowTypes } from '../overlays/shared/xyflow/_types'

export namespace DiagramFlowTypes {

  export type NodeData = {
    /**
     * The DiagramNode backing this node.
     */
    element: DiagramNode
  }

  export type CompoundNodeData = NodeData & {
    /**
     * Whether this node is a view group.
     */
    isViewGroup: boolean
  }

  export type ElementNode = SetRequired<ReactFlowNode<
      SharedFlowTypes.NonEmptyNodeData & NodeData,
      'element'>,
    'type'>

  export type CompoundNode = SetRequired<ReactFlowNode<
      SharedFlowTypes.NonEmptyNodeData & CompoundNodeData,
      'compound'>,
    'type'>

  export type Node = ElementNode | CompoundNode

  export type InternalNode = ReactFlowInternalNode<Node>

  export type XYFlowInstance = ReactFlowInstance<Node, Edge>

  export type XYFlowState = ReactFlowState<Node, Edge>

  export type DiagramEdgeData = {
    edge: DiagramEdge
    // if set - edge was changed by user
    controlPoints: XYPoint[] | null
    label: null | {
      bbox: BBox
      text: string
    }
  }

  export type Edge = Simplify<
    ReactFlowEdge<DiagramEdgeData, 'relationship'> & {
      type: 'relationship'
      // Make field required
      data: DiagramEdgeData
    }
  >
}
