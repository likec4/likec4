import type { BBox, DiagramEdge, DiagramNode, Fqn, XYPoint } from '@likec4/core'
import type { Edge, InternalNode, Node, ReactFlowInstance, ReactFlowState } from '@xyflow/react'
import { isNode } from '@xyflow/react'
import { isTruthy } from 'remeda'
import type { Simplify } from 'type-fest'

export type ElementXYFlowNode = Node<{
  fqn: Fqn
  element: DiagramNode
}, 'element'>

export type CompoundXYFlowNode = Node<{
  fqn: Fqn
  element: DiagramNode
}, 'compound'>

export type XYFlowNode = ElementXYFlowNode | CompoundXYFlowNode

export type InternalXYFlowNode = InternalNode<XYFlowNode>

export namespace XYFlowNode {
  export function isCompound(node: unknown): node is CompoundXYFlowNode {
    return isNode(node) && node.type === 'compound'
  }
  export function isElement(node: Node): node is ElementXYFlowNode {
    return isNode(node) && node.type === 'element'
  }

  export const is = (node: Node): node is XYFlowNode => isCompound(node) || isElement(node)
}

export type RelationshipData = {
  edge: DiagramEdge
  // if set - edge was changed by user
  controlPoints: XYPoint[] | null
  label: null | {
    bbox: BBox
    text: string
  }
}

export type RelationshipEdge = Simplify<
  Edge<RelationshipData, 'relationship'> & {
    type: 'relationship'
    // Make field required
    data: RelationshipData
  }
>

export type XYFlowEdge = RelationshipEdge

export namespace XYFlowEdge {
  export type Data = RelationshipData

  export const isRelationship = (e: Edge): e is RelationshipEdge => e.type === 'relationship' && isTruthy(e.data)
}

export type XYFlowInstance = ReactFlowInstance<XYFlowNode, XYFlowEdge>
export type XYFlowState = ReactFlowState<XYFlowNode, XYFlowEdge>
