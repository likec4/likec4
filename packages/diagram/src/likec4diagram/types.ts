import type {
  AutoLayoutDirection,
  BBox,
  DeploymentFqn,
  DiagramEdge,
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

  export type SequenceParallelAreaData = Simplify<
    & LeafNodeData
    & {
      parallelPrefix: string
    }
  >

  export type SequenceFrameKind = 'if' | 'optional' | 'repeat' | 'parallel' | 'group' | 'critical' | 'break'

  export type SequenceFrameBranch = {
    label?: string | undefined
    condition?: string | undefined
    separatorYs: ReadonlyArray<number>
  }

  export type SequenceFrameNodeData = {
    kind: SequenceFrameKind
    label?: string | undefined
    condition?: string | undefined
    depth: number
    parent?: string | undefined
    branches: ReadonlyArray<SequenceFrameBranch>
    viewId: ViewId
    /** Overlay nodes have no interactive drifts */
    readonly drifts: null
  }

  export type SequenceNoteNodeData = {
    placement: 'over' | 'left' | 'right'
    text: string
    viewId: ViewId
    /** Overlay nodes have no interactive drifts */
    readonly drifts: null
  }

  export type SequenceActivationNodeData = {
    actor: string
    depth: number
    viewId: ViewId
    /** Overlay nodes have no interactive drifts */
    readonly drifts: null
  }

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

  export type SequenceFrameBgNodeData = {
    kind: SequenceFrameKind
    depth: number
    viewId: ViewId
    /** Overlay nodes have no interactive drifts */
    readonly drifts: null
  }

  export type SequenceLifelineNodeData = {
    viewId: ViewId
    /** Overlay nodes have no interactive drifts */
    readonly drifts: null
  }

  export type SequenceActorNode = BaseNode<SequenceActorNodeData, 'seq-actor'>
  export type SequenceParallelArea = BaseNode<SequenceParallelAreaData, 'seq-parallel'>
  export type SequenceFrameNode = BaseNode<SequenceFrameNodeData, 'seq-frame'>
  export type SequenceFrameBgNode = BaseNode<SequenceFrameBgNodeData, 'seq-frame-bg'>
  export type SequenceLifelineNode = BaseNode<SequenceLifelineNodeData, 'seq-lifeline'>
  export type SequenceNoteNode = BaseNode<SequenceNoteNodeData, 'seq-note'>
  export type SequenceActivationNode = BaseNode<SequenceActivationNodeData, 'seq-activation'>

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
    | SequenceFrameNode
    | SequenceFrameBgNode
    | SequenceLifelineNode
    | SequenceNoteNode
    | SequenceActivationNode

  export type NodeType = AnyNode['type']

  /**
   * Overlay (non-interactive) sequence node types — have no model fqn, no id in data.
   */
  export type SequenceOverlayNodeType = 'seq-frame' | 'seq-frame-bg' | 'seq-lifeline' | 'seq-note' | 'seq-activation'

  /**
   * Interactive node types that have full LeafNodeData / CompoundNodeData fields.
   * Used as the default for untyped NodeProps to preserve existing callers.
   */
  export type InteractiveNodeType = Exclude<NodeType, SequenceOverlayNodeType>

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
  /**
   * Without a type argument resolves to interactive nodes only,
   * preserving callers that access data.id / data.drifts / etc.
   */
  export type NodeProps<Type extends NodeType = InteractiveNodeType> = BaseNodeProps<Node<Type>>

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
      isLabelCustomized?: boolean | undefined
      controlPoints: XYPosition[] | undefined | null
      /**
       * Sequence step number shown in the edge-label badge.
       * - a number → render that number (driven by `autonumber from N step M`)
       * - `null`   → render no number (autonumber disabled)
       * Overrides the default `extractStep(id)`, which is wrong for nested frame
       * ids (`step-03.alt.1.2` → 3 for every nested step).
       */
      stepNumber: number | null
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
