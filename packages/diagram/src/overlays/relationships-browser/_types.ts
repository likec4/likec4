import type {
  Color,
  DiagramNode,
  ExclusiveUnion,
  Fqn,
  IconUrl,
  NonEmptyArray,
  RelationId,
  RelationshipArrowType,
  RelationshipLineType,
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
    & BaseNodeData
    & NonOptional<
      Pick<
        DiagramNode,
        | 'id'
        | 'title'
        | 'technology'
        | 'description'
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

  // export type NonEmptyNode = ElementNode | CompoundNode

  export type EmptyNodeData = BaseNodeData & { column: Column }

  export type ElementNode = BaseNode<ElementNodeData, 'element'>
  export type CompoundNode = BaseNode<CompoundNodeData, 'compound'>
  export type EmptyNode = BaseNode<EmptyNodeData, 'empty'>

  export type AnyNode = ElementNode | CompoundNode | EmptyNode

  export type NodeType = AnyNode['type']
  export type Node<T extends NodeType = NodeType> = Extract<AnyNode, { type: T }>
  export type NodeProps<T extends NodeType = NodeType> = BaseNodeProps<Node<T>>

  export type NodeData = ExclusiveUnion<{
    ElementNodeData: ElementNodeData
    CompoundNodeData: CompoundNodeData
    EmptyNodeData: EmptyNodeData
  }>

  export type NodeRenderer<T extends NodeType = NodeType> = FunctionComponent<NodeProps<T>>
  export type NodeRenderers = {
    [T in NodeType]: NodeRenderer<T>
  }

  // Extend the edge types provided by SharedFlowTypes with RelationshipsOfEdgeData

  export type EdgeData = Simplify<
    BaseEdgeData & {
      sourceFqn: Fqn
      targetFqn: Fqn
      relations: NonEmptyArray<RelationId>
      color: Color
      label: string | null
      navigateTo: ViewId | null
      line: RelationshipLineType
      head?: RelationshipArrowType
      tail?: RelationshipArrowType
      existsInCurrentView: boolean
    }
  >

  export type Edge = BaseEdge<EdgeData, 'relationship'>
  export type EdgeProps = BaseEdgeProps<Edge>
}
