import type {
  DiagramNode,
  EdgeId,
} from '@likec4/core/types'
import type { Simplify } from 'type-fest'
import type { Base, NonOptional, ReactFlowEdge, ReactFlowNode } from '../../base/types'

export namespace SequenceViewTypes {
  /**
   * The node's incoming and outgoing ports
   */
  export type Ports = {
    totalRows: number
    in: Array<{ step: EdgeId; row: number }>
    out: Array<{ step: EdgeId; row: number }>
  }

  export type ActorNodeData =
    & Base.NodeData
    & NonOptional<
      Pick<
        DiagramNode,
        'title'
      > // | 'technology'
    > // | 'color'
    // | 'shape'
    // | 'width'
    // | 'height'
    // | 'navigateTo'
    // | 'style'
    // | 'tags'
    & {
      ports: Ports
    }

  export type StepNodeData =
    & Base.NodeData
    & {}

  export type ActorNode = ReactFlowNode<ActorNodeData, 'actor'>

  export type StepNode = ReactFlowNode<StepNodeData, 'step'>

  export type Node = ActorNode
  export type NodeData = Node['data']

  // Extend the edge types provided by SharedFlowTypes with RelationshipsOfEdgeData

  export type StepEdgeData = Simplify<
    Base.EdgeData & {
      // relationId: RelationId
      // color: Color | undefined
      // label: string | null
      // technology?: string | undefined
      // navigateTo: ViewId | null
      // line: RelationshipLineType
      // description: RichTextOrEmpty
    }
  >

  export type StepEdge = ReactFlowEdge<StepEdgeData, 'step'>

  export type Edge = StepEdge
}
