import type {
  BBox,
  DeploymentFqn,
  DiagramEdge,
  DiagramNode,
  ExclusiveUnion,
  Fqn,
  IconUrl,
  RichTextOrEmpty,
  ViewId,
} from '@likec4/core/types'
import type { NodeProps as XYNodeProps, XYPosition } from '@xyflow/system'
import type { FunctionComponent } from 'react'
import type { OptionalKeysOf, Simplify } from 'type-fest'
import type { Base, ReactFlowEdge, ReactFlowNode } from '../base/types'

type NonOptional<T extends object> = Simplify<
  & {
    [P in Exclude<keyof T, OptionalKeysOf<T>>]: T[P]
  }
  & {
    [P in OptionalKeysOf<T>]-?: T[P] | undefined
  }
>

export namespace Types {
  export type LeafNodeData = Simplify<
    & Base.NodeData
    & NonOptional<
      Pick<
        DiagramNode,
        | 'id'
        | 'title'
        | 'technology'
        | 'color'
        | 'shape'
        | 'width'
        | 'level'
        | 'height'
        | 'style'
        | 'tags'
        | 'position'
      >
    >
    & {
      description: RichTextOrEmpty
      /**
       * View this node belongs to
       */
      viewId: ViewId
      isMultiple?: boolean | undefined
      icon: string | null
    }
  >

  /**
   * Represents element from logical model
   */
  export type ElementNodeData = Simplify<
    LeafNodeData & {
      modelFqn: Fqn
      deploymentFqn?: never
      /**
       * If set - this node has navigation to another view and diagram has handler for this
       */
      navigateTo: ViewId | null
    }
  >

  /**
   * Represents element from deployment model
   */
  export type DeploymentElementNodeData = Simplify<
    & LeafNodeData
    & {
      navigateTo: ViewId | null
      deploymentFqn: DeploymentFqn
      // If set - this node refers to a model element
      modelFqn: Fqn | null
    }
  >

  export type SequenceActorNodePort = {
    id: string
    cx: number
    cy: number
    height: number
    type: 'target' | 'source'
    position: 'left' | 'right' | 'top' | 'bottom'
  }
  export type SequenceActorNodeData = Simplify<
    & LeafNodeData
    & {
      navigateTo: ViewId | null
      // If set - this node refers to a model element
      modelFqn: Fqn | null
      ports: Array<SequenceActorNodePort>
      viewHeight: number
    }
  >

  export type SequenceParallelAreaData = Simplify<
    & LeafNodeData
    & {
      parallelPrefix: string
    }
  >

  export type CompoundNodeData = Simplify<
    & Base.NodeData
    & NonOptional<
      Pick<
        DiagramNode,
        | 'id'
        | 'title'
        | 'color'
        | 'shape'
        | 'style'
        | 'tags'
        | 'position'
      >
    >
    & {
      /**
       * View this node belongs to
       */
      viewId: ViewId
      depth: number
      icon?: IconUrl
    }
  >

  export type CompoundElementNodeData = Simplify<
    & CompoundNodeData
    & {
      modelFqn: Fqn
      deploymentFqn?: never
      /**
       * If set - this node has navigation to another view and diagram has handler for this
       */
      navigateTo: ViewId | null
    }
  >

  export type CompoundDeploymentNodeData = Simplify<
    & CompoundNodeData
    & {
      deploymentFqn: DeploymentFqn
      /**
       * If set - this node refers to a model element
       */
      modelFqn: Fqn | null
      /**
       * If set - this node has navigation to another view and diagram has handler for this
       */
      navigateTo: ViewId | null
    }
  >

  export type ViewGroupNodeData = Simplify<
    & CompoundNodeData
    & {
      isViewGroup: true
    }
  >

  export type ElementNode = ReactFlowNode<ElementNodeData, 'element'>
  export type DeploymentElementNode = ReactFlowNode<DeploymentElementNodeData, 'deployment'>

  export type SequenceActorNode = ReactFlowNode<SequenceActorNodeData, 'seq-actor'>
  export type SequenceParallelArea = ReactFlowNode<SequenceParallelAreaData, 'seq-parallel'>

  export type CompoundElementNode = ReactFlowNode<CompoundElementNodeData, 'compound-element'>
  export type CompoundDeploymentNode = ReactFlowNode<CompoundDeploymentNodeData, 'compound-deployment'>
  export type ViewGroupNode = ReactFlowNode<ViewGroupNodeData, 'view-group'>

  export type Node =
    | ElementNode
    | DeploymentElementNode
    | CompoundElementNode
    | CompoundDeploymentNode
    | ViewGroupNode
    | SequenceActorNode
    | SequenceParallelArea

  export type NodeData = ExclusiveUnion<{
    ElementNodeData: ElementNodeData
    DeploymentElementNodeData: DeploymentElementNodeData
    CompoundElementNodeData: CompoundElementNodeData
    CompoundDeploymentNodeData: CompoundDeploymentNodeData
    ViewGroupNodeData: ViewGroupNodeData
    SequenceActorNodeData: SequenceActorNodeData
    SequenceParallelAreaData: SequenceParallelAreaData
  }>

  export type NodeProps = {
    element: XYNodeProps<ElementNode>
    deployment: XYNodeProps<DeploymentElementNode>
    'compound-element': XYNodeProps<CompoundElementNode>
    'compound-deployment': XYNodeProps<CompoundDeploymentNode>
    'view-group': XYNodeProps<ViewGroupNode>
    'seq-actor': XYNodeProps<SequenceActorNode>
    'seq-parallel': XYNodeProps<SequenceParallelArea>
  }

  export type RelationshipEdgeData = Simplify<
    & Base.EdgeData
    & NonOptional<
      Pick<
        DiagramEdge,
        | 'id'
        | 'label'
        | 'labelBBox'
        | 'technology'
        | 'points'
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
      labelXY: XYPosition | null
      controlPoints: XYPosition[] | undefined | null
    }
  >

  export type SequenceStepEdgeData = Simplify<
    & Base.EdgeData
    & NonOptional<
      Pick<
        DiagramEdge,
        | 'id'
        | 'label'
        | 'technology'
        | 'points'
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
      labelXY: XYPosition | null
      labelBBox: BBox
      controlPoints: XYPosition[] | undefined | null
    }
  >

  export type RelationshipEdge = ReactFlowEdge<RelationshipEdgeData, 'relationship'>
  export type SequenceStepEdge = ReactFlowEdge<SequenceStepEdgeData, 'seq-step'>

  export type Edge = RelationshipEdge | SequenceStepEdge
  export type EdgeData = RelationshipEdgeData | SequenceStepEdgeData

  export type Components = {
    [key in keyof NodeProps]: FunctionComponent<NodeProps[key]>
  }

  export type Component<T extends keyof NodeProps> = FunctionComponent<NodeProps[T]>
}
