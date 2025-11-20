import type {
  BBox,
  DeploymentFqn,
  DiagramEdge,
  DiagramEdgeDriftReason,
  DiagramNode,
  DiagramNodeDriftReason,
  ExclusiveUnion,
  Fqn,
  IconUrl,
  MarkdownOrString,
  NonEmptyReadonlyArray,
  ViewId,
} from '@likec4/core/types'
import type { XYPosition } from '@xyflow/system'
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
} from '../base/types'

export namespace Types {
  export type LeafNodeData = Simplify<
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
        | 'width'
        | 'level'
        | 'height'
        | 'style'
        | 'tags'
        | 'x'
        | 'y'
      >
    >
    & {
      // technology: string | null
      /**
       * View this node belongs to
       */
      viewId: ViewId
      isMultiple?: boolean | undefined
      icon: string | null
      drifts: NonEmptyReadonlyArray<DiagramNodeDriftReason> | null
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
    & BaseNodeData
    & NonOptional<
      Pick<
        DiagramNode,
        | 'id'
        | 'title'
        | 'color'
        | 'shape'
        | 'style'
        | 'tags'
        | 'x'
        | 'y'
      >
    >
    & {
      /**
       * View this node belongs to
       */
      viewId: ViewId
      depth: number
      icon?: IconUrl
      drifts: NonEmptyReadonlyArray<DiagramNodeDriftReason> | null
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

  export type ElementNode = BaseNode<ElementNodeData, 'element'>
  export type DeploymentElementNode = BaseNode<DeploymentElementNodeData, 'deployment'>

  export type SequenceActorNode = BaseNode<SequenceActorNodeData, 'seq-actor'>
  export type SequenceParallelArea = BaseNode<SequenceParallelAreaData, 'seq-parallel'>

  export type CompoundElementNode = BaseNode<CompoundElementNodeData, 'compound-element'>
  export type CompoundDeploymentNode = BaseNode<CompoundDeploymentNodeData, 'compound-deployment'>
  export type ViewGroupNode = BaseNode<ViewGroupNodeData, 'view-group'>

  export type AnyNode =
    | ElementNode
    | DeploymentElementNode
    | CompoundElementNode
    | CompoundDeploymentNode
    | ViewGroupNode
    | SequenceActorNode
    | SequenceParallelArea

  export type NodeType = AnyNode['type']

  export type NodeData = ExclusiveUnion<{
    ElementNodeData: ElementNodeData
    DeploymentElementNodeData: DeploymentElementNodeData
    CompoundElementNodeData: CompoundElementNodeData
    CompoundDeploymentNodeData: CompoundDeploymentNodeData
    ViewGroupNodeData: ViewGroupNodeData
    SequenceActorNodeData: SequenceActorNodeData
    SequenceParallelAreaData: SequenceParallelAreaData
  }>

  export type Node<Type extends NodeType = NodeType> = Extract<AnyNode, { type: Type }>
  export type NodeProps<Type extends NodeType = NodeType> = BaseNodeProps<Node<Type>>

  export type RelationshipEdgeData = Simplify<
    & BaseEdgeData
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
        | 'astPath'
        | 'drifts'
      >
    >
    & {
      notes: MarkdownOrString | null
      labelXY: XYPosition | null
      controlPoints: XYPosition[] | undefined | null
    }
  >

  export type SequenceStepEdgeData = Simplify<
    & BaseEdgeData
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
        | 'astPath'
        | 'drifts'
      >
    >
    & {
      notes: MarkdownOrString | null
      labelXY: XYPosition | null
      labelBBox: BBox
      controlPoints: XYPosition[] | undefined | null
    }
  >

  export type RelationshipEdge = BaseEdge<RelationshipEdgeData, 'relationship'>
  export type SequenceStepEdge = BaseEdge<SequenceStepEdgeData, 'seq-step'>

  export type AnyEdge = RelationshipEdge | SequenceStepEdge
  export type EdgeType = AnyEdge['type']

  export type Edge<Type extends EdgeType = EdgeType> = Extract<AnyEdge, { type: Type }>
  export type EdgeProps<Type extends EdgeType = EdgeType> = BaseEdgeProps<Edge<Type>>

  export type EdgeData = ExclusiveUnion<{
    RelationshipEdgeData: RelationshipEdgeData
    SequenceStepEdgeData: SequenceStepEdgeData
  }>

  export type NodeRenderer<T extends NodeType> = FunctionComponent<NodeProps<T>>
  export type NodeRenderers = {
    [T in NodeType]: NodeRenderer<T>
  }

  export type EdgeRenderer<T extends EdgeType> = FunctionComponent<EdgeProps<T>>
  export type EdgeRenderers = {
    [T in EdgeType]: EdgeRenderer<T>
  }
}
