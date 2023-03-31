import type { Opaque } from 'type-fest'
import type { Fqn } from './element'
import type { RelationID } from './relation'
import type { ElementView } from './view'

export type NodeId = Fqn

export type EdgeId = Opaque<string, 'EdgeId'>

export interface ComputedNode {
  id: NodeId
  // shape: ElementShape
  // color: ThemeColor
  parent: NodeId | null
  title: string
  description?: string
  children: NodeId[]
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
