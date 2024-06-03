import type { BBox, DiagramEdge, DiagramNode, Fqn, Point } from '@likec4/core'
import type {
  Edge,
  EdgeMouseHandler,
  InternalNode,
  Node,
  NodeMouseHandler,
  OnMoveEnd,
  OnMoveStart,
  ReactFlowInstance,
  ReactFlowState
} from '@xyflow/react'
import { isNode } from '@xyflow/react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { isTruthy } from 'remeda'
import type { SetReadonly, SetRequired, Simplify } from 'type-fest'

export type ElementNodeData = {
  fqn: Fqn
  element: DiagramNode
}

type TypedXYFlowNode<D extends Record<string, unknown>, T extends string> = SetReadonly<
  SetRequired<Node<D, T>, 'type'>,
  'id' | 'type'
>
type TypedXYFlowEdge<D extends Record<string, unknown>, T extends string> = SetReadonly<
  SetRequired<Edge<D, T>, 'type' | 'data'>,
  'id' | 'type'
>

export type ElementXYFlowNode = TypedXYFlowNode<ElementNodeData, 'element'>

export type CompoundNodeData = {
  fqn: Fqn
  element: DiagramNode
}

export type CompoundXYFlowNode = TypedXYFlowNode<CompoundNodeData, 'compound'>

export type XYFlowNode = ElementXYFlowNode | CompoundXYFlowNode

export type InternalXYFlowNode = InternalNode<XYFlowNode>

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

export type RelationshipData = {
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

export type RelationshipEdge = TypedXYFlowEdge<RelationshipData, 'relationship'>

export type XYFlowEdge = RelationshipEdge

export namespace XYFlowEdge {
  export type Data = RelationshipData

  export const isRelationship = (e: Edge): e is RelationshipEdge => e.type === 'relationship' && isTruthy(e.data)
}

export type XYFlowInstance = ReactFlowInstance<XYFlowNode, XYFlowEdge>
export type XYFlowState = ReactFlowState<XYFlowNode, XYFlowEdge>

export type XYFlowData = {
  nodes: XYFlowNode[]
  edges: XYFlowEdge[]
}

export type XYFlowEventHandlers = {
  onPanelClick: (event: ReactMouseEvent) => void
  onNodeContextMenu: NodeMouseHandler<XYFlowNode>
  onEdgeContextMenu: EdgeMouseHandler<XYFlowEdge>
  onPaneContextMenu: (event: ReactMouseEvent | MouseEvent) => void
  onNodeClick: NodeMouseHandler<XYFlowNode>
  onEdgeClick: EdgeMouseHandler<XYFlowEdge>
  onMoveStart: OnMoveStart
  onMoveEnd: OnMoveEnd
}
