import type { Color, DiagramNode, Fqn } from '@likec4/core'
import type { Base, NonOptional, ReactFlowEdge, ReactFlowNode } from '../../base/types'

export namespace RelationshipsBrowserTypes {
  // type Column = 'incomers' | 'subjects' | 'outgoers'

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
      // column: Column
      fqn: Fqn
      icon: string | null
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
      // column: Column
      fqn: Fqn
      depth: number
      icon: string | null
    }
  >

  export type ElementNode = ReactFlowNode<ElementNodeData, 'element'>

  export type CompoundNode = ReactFlowNode<CompoundNodeData, 'compound'>

  // export type NonEmptyNode = ElementNode | CompoundNode

  // export type EmptyNode = AddNodeData<SharedFlowTypes.EmptyNode, RelationshipsOfNodeData>

  export type Node = ElementNode | CompoundNode

  /**
   * Data that is exclusive to the relationships-of overlay. It will be merged into the edge types
   * provided by SharedFlowTypes.
   */
  type RelationshipsOfEdgeData = {
    existsInCurrentView: boolean
  }

  // Extend the edge types provided by SharedFlowTypes with RelationshipsOfEdgeData

  export type EdgeData = Base.EdgeData<{
    color: Color | undefined
  }>

  export type Edge = ReactFlowEdge<EdgeData, 'relationships'>
}
