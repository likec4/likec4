import type { BBox, DiagramEdge, DiagramNode, Point } from '@likec4/core'
import { type Edge, isNode, type Node, type ReactFlowInstance } from '@xyflow/react'
import { isTruthy } from 'remeda'
import type { SetReadonly, SetRequired, Simplify } from 'type-fest'

export type ElementNodeData = {
  id: string // xyflow id
  element: DiagramNode
}

type TypedXYFlowNode<D, T extends string> = SetReadonly<SetRequired<Node<D, T>, 'type'>, 'id' | 'type'>

export type ElementXYFlowNode = TypedXYFlowNode<ElementNodeData, 'element'>

export type CompoundNodeData = {
  id: string // xyflow id
  element: DiagramNode
}

export type CompoundXYFlowNode = TypedXYFlowNode<CompoundNodeData, 'compound'>

export type XYFlowNode = ElementXYFlowNode | CompoundXYFlowNode

export namespace XYFlowNode {
  export type Data = ElementNodeData | CompoundNodeData

  export function isCompound(node: unknown): node is CompoundXYFlowNode {
    return isNode(node) && node.type === 'compound'
  }
  export function isElement(node: Node): node is ElementXYFlowNode {
    return isNode(node) && node.type === 'element'
  }

  export const is = (node: Node): node is XYFlowNode => isCompound(node) || isElement(node)
}

export interface RelationshipData {
  edge: DiagramEdge
  controlPoints: Point[]
  headPoint: Point | null
  tailPoint: Point | null
  type: 'bezier' | 'poly'
  label: null | {
    bbox: BBox
    text: string
  }
}

export type RelationshipEdge = Simplify<
  SetRequired<
    Omit<Edge<RelationshipData>, 'type'>,
    'data'
  > & {
    type: 'relationship'
  }
>

export type XYFlowEdge = RelationshipEdge

export namespace XYFlowEdge {
  export type Data = RelationshipData

  export const isRelationship = (e: Edge): e is RelationshipEdge => e.type === 'relationship' && isTruthy(e.data)
}

export type XYFlowInstance = ReactFlowInstance<XYFlowNode, XYFlowEdge>
