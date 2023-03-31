import type { Opaque } from 'type-fest'
import type { ElementShape, Fqn, ThemeColor } from './element'
import type { RelationID } from './relation'
import type { ElementView, ViewID } from './view'

export type NodeId = Fqn

export type EdgeId = Opaque<string, 'EdgeId'>

export interface ComputedNode {
  id: NodeId
  parent: NodeId | null
  title: string
  description?: string
  technology?: string
  children: NodeId[]
  shape: ElementShape
  color: ThemeColor
  navigateTo?: ViewID
}


export interface ComputedEdge {
  id: EdgeId
  source: NodeId
  target: NodeId
  label: string | null
  relations: RelationID[]
}

export interface ComputedView extends ElementView {
  nodes: ComputedNode[]
  edges: ComputedEdge[]
}
