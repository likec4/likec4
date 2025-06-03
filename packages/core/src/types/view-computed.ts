import type * as aux from './aux'
import type { AnyAux, Unknown } from './aux'
import type { ElementStyle } from './model-logical'
import type * as scalar from './scalar'
import {
  type Icon,
  GroupElementKind,
} from './scalar'
import type {
  Color,
  ElementShape,
  RelationshipArrowType,
  RelationshipLineType,
} from './styles'
import type {
  BaseViewProperties,
  ViewAutoLayout,
  ViewManualLayout,
  ViewType,
  ViewWithHash,
  ViewWithNotation,
} from './view-common'

export interface ComputedNode<A extends AnyAux = Unknown> extends aux.WithOptionalTags<A>, aux.WithOptionalLinks {
  id: scalar.NodeId
  kind: aux.ElementKind<A> | aux.DeploymentKind<A> | typeof GroupElementKind
  parent: scalar.NodeId | null
  /**
   * Reference to model element
   * If 1 - node id is a reference
   */
  modelRef?: aux.Fqn<A> | undefined
  /**
   * Reference to deployment element
   * If 1 - node id is a reference
   */
  deploymentRef?: aux.DeploymentFqn<A> | undefined
  title: string
  description?: string | null
  technology?: string | null
  notation?: string
  children: scalar.NodeId[]
  inEdges: scalar.EdgeId[]
  outEdges: scalar.EdgeId[]
  shape: ElementShape
  color: Color
  icon?: Icon
  style: ElementStyle
  navigateTo?: aux.StrictViewId<A> | null
  level: number
  // For compound nodes, the max depth of nested nodes
  depth?: number
  /**
   * If this node was customized in the view
   */
  isCustomized?: boolean
}

export interface ComputedEdge<A extends AnyAux = AnyAux> extends aux.WithOptionalTags<A> {
  id: scalar.EdgeId
  parent: scalar.NodeId | null
  source: scalar.NodeId
  target: scalar.NodeId
  label: string | null
  description?: string
  technology?: string
  relations: scalar.RelationId[]
  kind?: aux.RelationKind<A> | typeof scalar.StepEdgeKind
  notation?: string
  // Notes for walkthrough
  notes?: string
  color?: Color
  line?: RelationshipLineType
  head?: RelationshipArrowType
  tail?: RelationshipArrowType
  // Link to dynamic view
  navigateTo?: aux.StrictViewId<A> | null
  /**
   * If this edge is derived from custom relationship predicate
   */
  isCustomized?: boolean
  /**
   * For layouting purposes
   * @default 'forward'
   */
  dir?: 'forward' | 'back' | 'both'
}

interface BaseComputedViewProperties<A extends AnyAux, Type extends ViewType>
  extends BaseViewProperties<A, 'computed', Type>, ViewWithHash, ViewWithNotation
{
  readonly autoLayout: ViewAutoLayout
  readonly nodes: ComputedNode<A>[]
  readonly edges: ComputedEdge<A>[]

  /**
   * If the view is changed manually this field contains the layout data.
   */
  readonly manualLayout?: ViewManualLayout | undefined
}

export interface ComputedElementView<A extends AnyAux = Unknown> extends BaseComputedViewProperties<A, 'element'> {
  readonly viewOf?: aux.StrictFqn<A>
  readonly extends?: aux.StrictViewId<A>
}

export interface ComputedScopedElementView<A extends AnyAux = Unknown>
  extends BaseComputedViewProperties<A, 'element'>
{
  readonly viewOf: aux.StrictFqn<A>
}

export interface ComputedDeploymentView<A extends AnyAux = Unknown>
  extends BaseComputedViewProperties<A, 'deployment'>
{
}

export interface ComputedDynamicView<A extends AnyAux = Unknown> extends BaseComputedViewProperties<A, 'dynamic'> {
}
