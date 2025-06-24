import type {
  Color,
  DiagramNode,
  Fqn,
  IconUrl,
  NonEmptyArray,
  RelationId,
  RelationshipLineType,
  RichTextOrEmpty,
  ViewId,
} from '@likec4/core/types'
import type { Simplify } from 'type-fest'
import type { Base, NonOptional, ReactFlowEdge, ReactFlowNode } from '../../base/types'

export namespace RelationshipsBrowserTypes {
  export type Column = 'incomers' | 'subjects' | 'outgoers'

  /**
   * The node's incoming and outgoing ports
   */
  export type Ports = {
    in: string[]
    out: string[]
  }

  export type ElementNodeData = Simplify<
    & Base.NodeData
    & NonOptional<
      Pick<
        DiagramNode,
        | 'title'
        | 'technology'
        | 'color'
        | 'shape'
        | 'style'
        | 'width'
        | 'height'
        | 'tags'
        | 'navigateTo'
      >
    >
    & {
      column: Column
      fqn: Fqn
      icon: string | null
      ports: Ports
      existsInCurrentView: boolean
      description: RichTextOrEmpty
    }
  >

  export type CompoundNodeData = Simplify<
    & Base.NodeData
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
      column: Column
      fqn: Fqn
      depth: number
      icon: IconUrl
      ports: Ports
      existsInCurrentView: boolean
    }
  >

  export type ElementNode = ReactFlowNode<ElementNodeData, 'element'>

  export type CompoundNode = ReactFlowNode<CompoundNodeData, 'compound'>

  // export type NonEmptyNode = ElementNode | CompoundNode

  export type EmptyNodeData = Base.NodeData & { column: Column }

  export type EmptyNode = ReactFlowNode<EmptyNodeData, 'empty'>

  export type Node = ElementNode | CompoundNode | EmptyNode
  export type NodeData = Node['data']

  // Extend the edge types provided by SharedFlowTypes with RelationshipsOfEdgeData

  export type EdgeData = Simplify<
    Base.EdgeData & {
      sourceFqn: Fqn
      targetFqn: Fqn
      relations: NonEmptyArray<RelationId>
      color: Color | undefined
      label: string | null
      navigateTo: ViewId | null
      line: RelationshipLineType
      existsInCurrentView: boolean
    }
  >

  export type Edge = ReactFlowEdge<EdgeData, 'relationship'>
}
