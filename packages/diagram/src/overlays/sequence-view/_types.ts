import type {
  DiagramEdge,
  DiagramNode,
  RichTextOrEmpty,
} from '@likec4/core/types'
import type { Simplify } from 'type-fest'
import type { Base, NonOptional, ReactFlowEdge, ReactFlowNode } from '../../base/types'

export namespace SequenceViewTypes {
  export type Port = {
    id: string
    x: number
    y: number
    width: number
    height: number
    type: 'target' | 'source'
    position: 'left' | 'right' | 'top' | 'bottom'
  }

  /**
   * The node's incoming and outgoing ports
   */
  export type Ports = {
    in: Array<Port>
    out: Array<Port>
  }

  export type ActorNodeData =
    & Base.NodeData
    & NonOptional<
      Pick<
        DiagramNode,
        | 'title'
        | 'technology'
        | 'modelRef'
        | 'color'
        | 'width'
        | 'height'
        | 'shape'
        | 'navigateTo'
        | 'style'
        | 'tags'
      >
    >
    & {
      viewNode: DiagramNode
      description: RichTextOrEmpty
      ports: Array<Port>
      verticalLineHeight: number
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
    & Base.EdgeData
    & NonOptional<
      Pick<
        DiagramEdge,
        | 'id'
        | 'label'
        | 'labelBBox'
        | 'technology'
        | 'dir'
        | 'color'
        | 'line'
        | 'head'
        | 'tail'
        | 'navigateTo'
      >
    >
    & {
      notes: RichTextOrEmpty
      description: RichTextOrEmpty
    }
  >

  export type StepEdge = ReactFlowEdge<StepEdgeData, 'step'>

  export type Edge = StepEdge
}
