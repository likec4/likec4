import type { Except } from 'type-fest'
import type {
  Color,
  ElementShape,
  RelationshipArrowType,
  RelationshipLineType,
} from '../styles/types'
import type * as aux from './_aux'
import type { AnyAux } from './_aux'
import type { _stage, _type } from './const'
import type { ElementStyle } from './model-logical'
import type * as scalar from './scalar'
import type {
  Icon,
} from './scalar'
import type {
  BaseViewProperties,
  ViewAutoLayout,
  ViewManualLayout,
  ViewWithHash,
  ViewWithNotation,
} from './view-common'
import type { DynamicViewDisplayVariant } from './view-parsed.dynamic'

export type ComputedNodeStyle = Except<ElementStyle, 'icon' | 'shape' | 'color', { requireExactProps: true }>

// dprint-ignore
export interface ComputedNode<A extends AnyAux = AnyAux>
  extends
    aux.WithTags<A>,
    aux.WithOptionalLinks
{  
  id: scalar.NodeId
  kind: aux.ElementKind<A> | aux.DeploymentKind<A> | '@group'
  parent: scalar.NodeId | null
  /**
   * Reference to model element
   */
  modelRef?: aux.Fqn<A>
  /**
   * Reference to deployment element
   */
  deploymentRef?: aux.DeploymentFqn<A>
  title: string
  /**
   * Description of the node
   * either summary or description
   */
  description?: scalar.MarkdownOrString | null
  technology?: string | null
  children: scalar.NodeId[]
  inEdges: scalar.EdgeId[]
  outEdges: scalar.EdgeId[]
  shape: ElementShape
  color: Color
  icon?: Icon
  style: ComputedNodeStyle
  navigateTo?: aux.StrictViewId<A> | null
  level: number
  // For compound nodes, the max depth of nested nodes
  depth?: number | null
  /**
   * If this node was customized in the view
   */
  isCustomized?: boolean
  notation?: string | null
}

export interface ComputedEdge<A extends AnyAux = AnyAux> extends aux.WithOptionalTags<A> {
  id: scalar.EdgeId
  parent: scalar.NodeId | null
  source: scalar.NodeId
  target: scalar.NodeId
  label: string | null
  description?: scalar.MarkdownOrString | null
  technology?: string | null
  relations: scalar.RelationId[]
  kind?: aux.RelationKind<A> | typeof scalar.StepEdgeKind
  notation?: string
  // Notes for walkthrough
  notes?: scalar.MarkdownOrString
  color: Color
  line: RelationshipLineType
  head?: RelationshipArrowType
  tail?: RelationshipArrowType
  // Link to dynamic view
  navigateTo?: aux.StrictViewId<A> | null
  /**
   * If this edge is derived from custom relationship predicate
   */
  isCustomized?: boolean
  /**
   * Path to the AST node relative to the view body ast
   * Available only in dynamic views
   * @internal
   */
  astPath?: string
  /**
   * For layouting purposes
   * @default 'forward'
   */
  dir?: 'forward' | 'back' | 'both'
}

export interface ComputedRankConstraint {
  type: 'same' | 'min' | 'max' | 'source' | 'sink'
  nodes: scalar.NodeId[]
}

interface BaseComputedViewProperties<A extends AnyAux> extends BaseViewProperties<A>, ViewWithHash, ViewWithNotation {
  readonly [_stage]: 'computed'
  readonly autoLayout: ViewAutoLayout
  readonly nodes: ComputedNode<A>[]
  readonly edges: ComputedEdge<A>[]
  /**
   * If the view has manual layout (v2)
   */
  readonly hasManualLayout?: boolean

  /**
   * Manual layout data (v1), for compatibility during migration
   * @deprecated
   */
  readonly manualLayout?: ViewManualLayout | undefined
}

export interface ComputedElementView<A extends AnyAux = AnyAux> extends BaseComputedViewProperties<A> {
  readonly [_type]: 'element'
  readonly viewOf?: aux.StrictFqn<A>
  readonly extends?: aux.StrictViewId<A>
  readonly ranks?: ComputedRankConstraint[]
}

export interface ComputedDeploymentView<A extends AnyAux = AnyAux> extends BaseComputedViewProperties<A> {
  readonly [_type]: 'deployment'
}

export interface ComputedDynamicView<A extends AnyAux = AnyAux> extends BaseComputedViewProperties<A> {
  readonly [_type]: 'dynamic'
  /**
   * How to display the dynamic view
   * - `diagram`: display as a regular likec4 view
   * - `sequence`: display as a sequence diagram
   */
  readonly variant: DynamicViewDisplayVariant
}
