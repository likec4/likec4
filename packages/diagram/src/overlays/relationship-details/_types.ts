import type { Color, DiagramNode, Fqn, RelationId, RelationshipLineType, ViewId } from '@likec4/core'
import type { Base, NonOptional, ReactFlowEdge, ReactFlowNode } from '../../base/types'

export namespace RelationshipDetailsTypes {
  /**
   * The node's incoming and outgoing ports
   */
  export type Ports = {
    in: string[]
    out: string[]
  }

  export type ElementNodeData = Base.NodeData<
    & NonOptional<
      Pick<
        DiagramNode,
        | 'title'
        | 'technology'
        | 'description'
        | 'color'
        | 'shape'
        | 'width'
        | 'height'
        | 'navigateTo'
        | 'style'
      >
    >
    & {
      fqn: Fqn
      icon: string | null
      ports: Ports
    }
  >

  export type CompoundNodeData = Base.NodeData<
    & NonOptional<
      Pick<
        DiagramNode,
        | 'title'
        | 'color'
        | 'shape'
        | 'style'
      >
    >
    & {
      fqn: Fqn
      depth: number
      icon: string | null
      ports: Ports
    }
  >

  export type ElementNode = ReactFlowNode<ElementNodeData, 'element'>

  export type CompoundNode = ReactFlowNode<CompoundNodeData, 'compound'>

  export type Node = ElementNode | CompoundNode
  export type NodeData = Node['data']

  // Extend the edge types provided by SharedFlowTypes with RelationshipsOfEdgeData

  export type EdgeData = Base.EdgeData<{
    relationId: RelationId
    color: Color | undefined
    label: string | null
    technology: string | null
    description: string | null
    navigateTo: ViewId | null
    line: RelationshipLineType
  }>

  export type Edge = ReactFlowEdge<EdgeData, 'relationship'>
}
