import type {
  BBox,
  ComputedNode,
  DiagramEdge,
  DiagramNode,
  EdgeId,
  ElementShape,
  Fqn,
  NonEmptyArray,
  Point,
  RelationshipLineType,
  ThemeColor,
  ViewID
} from '@likec4/core'
import { type Edge, isNode, type Node } from '@xyflow/react'
import { isNil, isTruthy } from 'remeda'
import type { SetRequired, Simplify } from 'type-fest'

export interface ElementNodeData extends DiagramNode {
}

export type ElementNode = Node<ElementNodeData, 'element'>

export interface CompoundNodeData extends DiagramNode {
}

export type CompoundNode = SetRequired<Node<CompoundNodeData, 'compound'>, 'type'>

export type EditorNode = ElementNode | CompoundNode

export namespace EditorNode {
  export type Data = CompoundNodeData | ElementNodeData

  export function isCompound(node: unknown): node is CompoundNode {
    return isNode(node) && node.type === 'compound'
  }
  export function isElement(node: Node): node is ElementNode {
    return isNode(node) && node.type === 'element'
  }

  export const is = (node: Node): node is EditorNode => isCompound(node) || isElement(node)
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

export type EditorEdge = RelationshipEdge

export namespace EditorEdge {
  export type Data = RelationshipData

  export const isRelationship = (e: Edge): e is RelationshipEdge => e.type === 'relationship' && isTruthy(e.data)
}

export interface ChangeColor {
  op: 'change-color'
  color: ThemeColor
  targets: NonEmptyArray<Fqn>
}

export interface ChangeShape {
  op: 'change-shape'
  shape: ElementShape
  targets: NonEmptyArray<Fqn>
}

export type ChangeCommand = ChangeColor | ChangeShape

export type OnChange = (change: ChangeCommand) => void
