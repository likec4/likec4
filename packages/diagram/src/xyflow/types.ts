import type { BBox, DiagramEdge, DiagramNode, Fqn, XYPoint } from '@likec4/core'
import type { Edge, InternalNode, Node as ReactFlowNode, ReactFlowInstance, ReactFlowState } from '@xyflow/react'
import { isNode as isXYFlowNode } from '@xyflow/react'
import { isTruthy } from 'remeda'
import type { Simplify } from 'type-fest'

export type ElementXYFlowNode = ReactFlowNode<{
  fqn: Fqn
  element: DiagramNode
}, 'element'>

export type CompoundXYFlowNode = ReactFlowNode<{
  fqn: Fqn
  isViewGroup: boolean
  element: DiagramNode
}, 'compound'>

export type XYFlowNode = ElementXYFlowNode | CompoundXYFlowNode

export type InternalXYFlowNode = InternalNode<XYFlowNode>

export namespace XYFlowNode {
  export function isCompound(node: unknown): node is CompoundXYFlowNode {
    return isXYFlowNode(node) && node.type === 'compound'
  }
  export function isElement(node: ReactFlowNode): node is ElementXYFlowNode {
    return isXYFlowNode(node) && node.type === 'element'
  }

  export const is = (node: ReactFlowNode): node is XYFlowNode => isCompound(node) || isElement(node)
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
