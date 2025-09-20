import type {
  Color,
  DiagramNode,
  ExclusiveUnion,
  Fqn,
  IconUrl,
  RelationId,
  RelationshipArrowType,
  RelationshipLineType,
  RichTextOrEmpty,
  ViewId,
} from '@likec4/core/types'
import type { FunctionComponent } from 'react'
import type { Simplify } from 'type-fest'
import type {
  BaseEdge,
  BaseEdgeData,
  BaseEdgeProps,
  BaseNode,
  BaseNodeData,
  BaseNodeProps,
  NonOptional,
} from '../../base/types'

export namespace RelationshipDetailsTypes {
  export type Column = 'sources' | 'targets'
  /**
   * The node's incoming and outgoing ports
   */
  export type Ports = {
    in: string[]
    out: string[]
  }

  export type ElementNodeData = Simplify<
    & BaseNodeData
    & NonOptional<
      Pick<
        DiagramNode,
        | 'id'
        | 'title'
        | 'technology'
        | 'color'
        | 'shape'
        | 'width'
        | 'height'
        | 'navigateTo'
        | 'style'
        | 'tags'
      >
    >
    & {
      column: Column
      fqn: Fqn
      icon: IconUrl
      ports: Ports
      description: RichTextOrEmpty
    }
  >

  export type CompoundNodeData = Simplify<
    & BaseNodeData
    & NonOptional<
      Pick<
        DiagramNode,
        | 'id'
        | 'title'
        | 'color'
        | 'style'
      >
    >
    & {
      column: Column
      fqn: Fqn
      depth: number
      icon?: IconUrl
      ports: Ports
    }
  >
  export type ElementNode = BaseNode<ElementNodeData, 'element'>

  export type CompoundNode = BaseNode<CompoundNodeData, 'compound'>

  export type AnyNode = ElementNode | CompoundNode

  export type NodeType = AnyNode['type']
  export type Node<T extends NodeType = NodeType> = Extract<AnyNode, { type: T }>
  export type NodeProps<T extends NodeType = NodeType> = BaseNodeProps<Node<T>>

  export type NodeData = ExclusiveUnion<{
    ElementNodeData: ElementNodeData
    CompoundNodeData: CompoundNodeData
  }>

  export type NodeRenderer<T extends NodeType = NodeType> = FunctionComponent<NodeProps<T>>
  export type NodeRenderers = {
    element: NodeRenderer<'element'>
    compound: NodeRenderer<'compound'>
  }

  // Extend the edge types provided by SharedFlowTypes with RelationshipsOfEdgeData

  export type EdgeData = Simplify<
    BaseEdgeData & {
      relationId: RelationId
      color: Color
      label: string | null
      technology?: string | undefined
      navigateTo: ViewId | null
      line: RelationshipLineType
      head?: RelationshipArrowType
      tail?: RelationshipArrowType
      description: RichTextOrEmpty
    }
  >

  export type Edge = BaseEdge<EdgeData, 'relationship'>
  export type EdgeProps = BaseEdgeProps<Edge>
}
