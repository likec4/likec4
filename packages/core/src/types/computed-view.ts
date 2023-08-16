import type { Opaque } from './opaque'
import type { ElementKind, ElementShape, Fqn, Tag } from './element'
import type { RelationID } from './relation'
import type { ElementView, ViewID, ViewRuleAutoLayout } from './view'
import type { IconUrl, NonEmptyArray } from './_common'
import type { ThemeColor } from './theme'

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
}

export interface ComputedEdge {
  id: EdgeId
  parent: NodeId | null
  source: NodeId
  target: NodeId
  label: string | null
  relations: RelationID[]
}

export type ComputedView = ElementView & {
  autoLayout: ViewRuleAutoLayout['autoLayout']
  nodes: ComputedNode[]
  edges: ComputedEdge[]
}
