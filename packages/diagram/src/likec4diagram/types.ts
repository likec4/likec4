import type {
  AutoLayoutDirection,
  BBox,
  DeploymentFqn,
  DiagramEdge,
  DiagramNode,
  DiagramNodeDriftReason,
  DynamicViewFlow,
  ExclusiveUnion,
  Fqn,
  IconUrl,
  MarkdownOrString,
  NonEmptyReadonlyArray,
  StepPath,
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
        | 'notes'
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
      /**
       * View layout direction, used by DefaultHandles to position node handles
       */
      viewLayoutDir?: AutoLayoutDirection | undefined
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
      modelFqn: Fqn | null
      ports: Array<SequenceActorNodePort>
      viewHeight: number
    }
  >

  /**
   * Represents subflow area in the diagram
   * `try` and `alt` flows have special handling in the diagram
   */
  export type SequenceSubflowData =
    & LeafNodeData
    & {
      flowId: StepPath
      title: string | undefined
      /**
       * If set - this subflow (or one of its branches) is active
       */
      activeBranch?: StepPath | undefined
      state?: 'processed' | 'active' | 'skipped' | 'pending' | undefined
    }
    & (
      | SequenceSubflowData.Try
      | SequenceSubflowData.Alt
      | {
        flowType: Exclude<DynamicViewFlow.SubFlow['_type'], 'try' | 'alt'>
        hasSubflows: boolean
      }
    )

  export namespace SequenceSubflowData {
    export type Branch = {
      flowId: StepPath
      title: string | undefined
      x: number
      y: number
      width: number
      height: number
      hasSubflows: boolean
    }

    export type Try = {
      flowType: 'try'
      tryBlock: Branch
      catchBlock: undefined | Branch
      finallyBlock: undefined | Branch
      hasSubflows: boolean
    }

    export type Alt = {
      flowType: 'alt'
      branches: Array<Branch & { flowType: 'alt-when' | 'alt-else' | 'alt-if' }>
      hasSubflows: boolean
    }
  }

  /**
   * @deprecated Use {@link SequenceSubflowData} instead
   */
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
        | 'notes'
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
       * View layout direction, used by DefaultHandles to position node handles
       */
      viewLayoutDir?: AutoLayoutDirection | undefined
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
  export type SequenceSubflowArea = BaseNode<SequenceSubflowData, 'seq-subflow'>

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
    | SequenceSubflowArea

  export type NodeType = AnyNode['type']

  export type NodeData = ExclusiveUnion<{
    ElementNodeData: ElementNodeData
    DeploymentElementNodeData: DeploymentElementNodeData
    CompoundElementNodeData: CompoundElementNodeData
    CompoundDeploymentNodeData: CompoundDeploymentNodeData
    ViewGroupNodeData: ViewGroupNodeData
    SequenceActorNodeData: SequenceActorNodeData
    SequenceParallelAreaData: SequenceParallelAreaData
    SequenceSubflowAreaData: SequenceSubflowData
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
      isLabelCustomized?: boolean | undefined
      controlPoints: XYPosition[] | undefined | null
      /**
       * When dynamic view in "diagram" variant
       * Edges are RelationshipEdgeData - stepnum is used to determine the step number
       * (backward compatibility)
       */
      stepnum?: number
    }
  >

  export type SequenceStepEdgeData = Simplify<
    & BaseEdgeData
    & NonOptional<
      Pick<
        DiagramEdge,
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
      id: StepPath
      state?: 'processed' | 'active' | 'skipped' | 'pending' | null
      stepnum: number
      parentFlow: null | {
        id: StepPath
        type: DynamicViewFlow.SubFlowType
      }
      notes: MarkdownOrString | null
      labelXY: XYPosition | null
      labelBBox: BBox
      isLabelCustomized?: boolean | undefined
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
