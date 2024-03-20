import type { IconUrl, NonEmptyArray } from './_common'
import type { ElementKind, ElementShape, Fqn, Tag } from './element'
import type { Opaque } from './opaque'
import type { RelationID, RelationshipArrowType, RelationshipLineType } from './relation'
import type { ThemeColor } from './theme'
import type { BasicElementView, ViewID, ViewRuleAutoLayout } from './view'

export type NodeId = Fqn

export type EdgeId = Opaque<string, 'EdgeId'>

export interface ComputedNode {
  id: NodeId
  kind: ElementKind
  parent: NodeId | null
  title: string
  description: string | null
  technology: string | null
  tags: NonEmptyArray<Tag> | null
  links: NonEmptyArray<string> | null
  children: NodeId[]
  inEdges: EdgeId[]
  outEdges: EdgeId[]
  shape: ElementShape
  color: ThemeColor
  icon?: IconUrl
  navigateTo?: ViewID
  level: number
  // For compound nodes, the max depth of nested nodes
  depth?: number
}

export interface ComputedEdge {
  id: EdgeId
  parent: NodeId | null
  source: NodeId
  target: NodeId
  label: string | null
  relations: RelationID[]
  color?: ThemeColor
  line?: RelationshipLineType
  head?: RelationshipArrowType
  tail?: RelationshipArrowType
}

export interface ComputedView extends Omit<BasicElementView, 'rules'> {
  readonly extends?: ViewID
  readonly autoLayout: ViewRuleAutoLayout['autoLayout']
  readonly nodes: ComputedNode[]
  readonly edges: ComputedEdge[]
}
