import type { Color, DiagramNode, Fqn, IconUrl, NonEmptyArray, RelationId, RelationshipLineType, ViewId } from '@likec4/core'
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
      >
    >
    & {
      column: Column
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
      column: Column
      fqn: Fqn
      depth: number
      icon: IconUrl
      ports: Ports
    }
  >

  export type ElementNode = ReactFlowNode<ElementNodeData, 'element'>

  export type CompoundNode = ReactFlowNode<CompoundNodeData, 'compound'>

  // export type NonEmptyNode = ElementNode | CompoundNode

  export type EmptyNodeData = Base.NodeData<{
    column: Column
  }>

  export type EmptyNode = ReactFlowNode<EmptyNodeData, 'empty'>

  export type Node = ElementNode | CompoundNode | EmptyNode
  export type NodeData = Node['data']

  /**
   * Data that is exclusive to the relationships-of overlay. It will be merged into the edge types
   * provided by SharedFlowTypes.
   */
  type RelationshipsOfEdgeData = {
    existsInCurrentView: boolean
  }

  // Extend the edge types provided by SharedFlowTypes with RelationshipsOfEdgeData

  export type EdgeData = Base.EdgeData<{
    relations: NonEmptyArray<RelationId>
    color: Color | undefined
    label: string | null
    navigateTo: ViewId | null
    line: RelationshipLineType
  }>

  export type Edge = ReactFlowEdge<EdgeData, 'relationships'>
}
