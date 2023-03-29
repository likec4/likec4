import type { Opaque } from 'type-fest'
import type { ElementView, Fqn, RelationID } from '../types'

export type NodeId = Fqn

export type EdgeId = Opaque<string, 'EdgeId'>

export interface ComputedNode {
  id: NodeId
  // shape: ElementShape
  // color: ThemeColor
  parent: NodeId | null
  title: string
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
