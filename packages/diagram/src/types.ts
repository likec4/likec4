import type {
  BBox,
  ComputedNode,
  EdgeId,
  ElementShape,
  Fqn,
  Point,
  RelationshipLineType,
  ThemeColor,
  ViewID
} from '@likec4/core'
import { type Edge, isNode, type Node } from '@xyflow/react'
import { isNil, isTruthy } from 'remeda'
import type { SetRequired, Simplify } from 'type-fest'

interface BaseLikec4NodeData {
  fqn: Fqn
  parent: Fqn | null
  title: string
  description: string | null
  technology: string | null
  shape: ElementShape
  color: ThemeColor
  level: number
  w: number
  h: number
  navigateTo: ViewID | null
  inEdges: string[]
  outEdges: string[]
}

export const dataFromComputedNode = (
  node: ComputedNode
): Omit<BaseLikec4NodeData, 'w' | 'h' | 'inEdges' | 'outEdges'> => ({
  fqn: node.id,
  parent: node.parent,
  title: node.title,
  description: node.description,
  technology: node.technology,
  shape: node.shape,
  color: node.color,
  level: node.level,
  navigateTo: node.navigateTo ?? null
})

export interface ElementNodeData extends BaseLikec4NodeData {
}

export type ElementNode = Node<ElementNodeData, 'element'>

export interface CompoundNodeData extends BaseLikec4NodeData {
  // children: NonEmptyArray<Fqn>
  depth: number
}

export type CompoundNode = SetRequired<Node<CompoundNodeData, 'compound'>, 'type'>

export type EditorNode = ElementNode | CompoundNode

export namespace EditorNode {
  export type BaseData = BaseLikec4NodeData

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
  id: EdgeId
  source: Fqn
  target: Fqn
  points: [Point, Point, ...Point[]]
  headPoint: Point | null
  tailPoint: Point | null
  type: 'bezier' | 'poly'
  label: null | {
    bbox: BBox
    text: string
  }
  color: ThemeColor | null
  line: RelationshipLineType | null
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
