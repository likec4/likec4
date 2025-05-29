import { isArray } from 'remeda'
import type { MergeExclusive, Simplify } from 'type-fest'
import type { Link, NonEmptyArray, Point, XYPoint } from './_common'
import type { Any, AnyAux, Aux } from './aux'
import type { Expression, FqnExpr } from './expression'
import type { ModelExpression, ModelFqnExpr } from './expression-model'
import type { GlobalPredicateId, GlobalStyleID } from './global'
import type { ElementStyle } from './model-logical'
import {
  type Icon,
  GroupElementKind,
  isStepEdgeId,
} from './scalars'
import type {
  BorderStyle,
  Color,
  ElementShape,
  RelationshipArrowType,
  RelationshipLineType,
  ShapeSize,
  SpacingSize,
  TextSize,
  ThemeColorValues,
} from './styles'
import type { ElementNotation } from './view-notation'

export type ViewRulePredicate<A extends AnyAux = Any> =
  | {
    include: ModelExpression<A>[]
    exclude?: never
  }
  | {
    include?: never
    exclude: ModelExpression<A>[]
  }

export function isViewRulePredicate<A extends AnyAux>(
  rule: DeploymentViewRule<A>,
): rule is DeploymentViewRulePredicate<A>
export function isViewRulePredicate<A extends AnyAux>(rule: DynamicViewRule<A>): rule is DynamicViewIncludeRule<A>
export function isViewRulePredicate<A extends AnyAux>(rule: ViewRule<A>): rule is ViewRulePredicate<A>
export function isViewRulePredicate(rule: object) {
  return (
    ('include' in rule && Array.isArray(rule.include))
    || ('exclude' in rule && Array.isArray(rule.exclude))
  )
}

export interface ViewRuleGlobalPredicateRef {
  predicateId: GlobalPredicateId
}
export function isViewRuleGlobalPredicateRef(rule: ViewRule<any>): rule is ViewRuleGlobalPredicateRef {
  return 'predicateId' in rule
}

export interface ViewRuleStyle<A extends AnyAux = Any> {
  targets: ModelFqnExpr<A>[]
  notation?: string
  style: ElementStyle & {
    color?: Color
    shape?: ElementShape
    icon?: Icon
  }
}
export function isViewRuleStyle<A extends AnyAux>(rule: DeploymentViewRule<A>): rule is DeploymentViewRuleStyle<A>
export function isViewRuleStyle<A extends AnyAux>(rule: ViewRule<A>): rule is ViewRuleStyle<A>
export function isViewRuleStyle(rule: object) {
  return 'style' in rule && 'targets' in rule && Array.isArray(rule.targets)
}

export interface ViewRuleGlobalStyle {
  styleId: GlobalStyleID
}
export function isViewRuleGlobalStyle(rule: ViewRule<any>): rule is ViewRuleGlobalStyle {
  return 'styleId' in rule
}

export type ViewRuleStyleOrGlobalRef<A extends AnyAux = Any> = ViewRuleStyle<A> | ViewRuleGlobalStyle

export type AutoLayoutDirection = 'TB' | 'BT' | 'LR' | 'RL'
export function isAutoLayoutDirection(autoLayout: unknown): autoLayout is AutoLayoutDirection {
  return autoLayout === 'TB' || autoLayout === 'BT' || autoLayout === 'LR' || autoLayout === 'RL'
}

export interface ViewRuleAutoLayout {
  direction: AutoLayoutDirection
  nodeSep?: number
  rankSep?: number
}

export function isViewRuleAutoLayout(rule: object): rule is ViewRuleAutoLayout {
  return 'direction' in rule
}

export interface ViewRuleGroup<A extends AnyAux = Any> {
  groupRules: Array<ViewRulePredicate<A> | ViewRuleGroup<A>>
  title: string | null
  color?: Color
  border?: BorderStyle
  // 0-100
  opacity?: number
  multiple?: boolean
  size?: ShapeSize
  padding?: SpacingSize
  textSize?: TextSize
}

export function isViewRuleGroup<A extends AnyAux>(rule: ViewRule<A>): rule is ViewRuleGroup<A> {
  return 'title' in rule && 'groupRules' in rule && Array.isArray(rule.groupRules)
}

export type ViewRule<A extends AnyAux = Any> =
  | ViewRulePredicate<A>
  | ViewRuleGlobalPredicateRef
  | ViewRuleGroup<A>
  | ViewRuleStyle<A>
  | ViewRuleGlobalStyle
  | ViewRuleAutoLayout

export interface BasicView<A extends AnyAux> {
  readonly id: Aux.Strict.ViewId<A>
  readonly title: string | null
  readonly description: string | null
  readonly tags: Aux.Tags<A> | null
  readonly links: NonEmptyArray<Link> | null

  /**
   * URI to the source file of this view.
   * Undefined if the view is auto-generated.
   */
  readonly docUri?: string
  /**
   * For all views we find common ancestor path.
   * This is used to generate relative paths, i.e.:
   * - "/home/project/index.c4" becomes "index.c4"
   * - "/home/project/subdir/views.c4" becomes "subdir/views.c4"
   *
   * Undefined if the view is auto-generated.
   */
  readonly relativePath?: string

  /**
   * If the view is changed manually this field contains the layout data.
   */
  readonly manualLayout?: ViewManualLayout | undefined

  readonly customColorDefinitions: CustomColorDefinitions
}

export interface UnscopedElementView<A extends AnyAux = Any> extends BasicView<A> {
  readonly __: 'element'
  readonly rules: ViewRule<A>[]
  viewOf?: never
  extends?: never
}
export interface ScopedElementView<A extends AnyAux = Any> extends BasicView<A> {
  readonly __: 'element'
  readonly rules: ViewRule<A>[]
  readonly viewOf: Aux.Strict.Fqn<A>
  extends?: never
}

export interface ExtendsElementView<A extends AnyAux = Any> extends BasicView<A> {
  readonly __: 'element'
  readonly rules: ViewRule<A>[]
  readonly viewOf?: Aux.Strict.Fqn<A>
  readonly extends: Aux.Strict.ViewId<A>
}
export type ElementView<A extends AnyAux = Any> =
  | UnscopedElementView<A>
  | ScopedElementView<A>
  | ExtendsElementView<A>

export interface DynamicViewStep<A extends AnyAux = Any> {
  readonly source: Aux.Strict.Fqn<A>
  readonly target: Aux.Strict.Fqn<A>
  readonly title: string | null
  readonly description?: string
  readonly technology?: string
  readonly notation?: string
  // Notes for walkthrough
  readonly notes?: string
  readonly color?: Color
  readonly line?: RelationshipLineType
  readonly head?: RelationshipArrowType
  readonly tail?: RelationshipArrowType
  readonly isBackward?: boolean
  // Link to dynamic view
  readonly navigateTo?: Aux.Strict.ViewId<A>
}

export interface DynamicViewParallelSteps<A extends AnyAux = Any> {
  readonly __parallel: DynamicViewStep<A>[]
}

export type DynamicViewStepOrParallel<A extends AnyAux = Any> = Simplify<
  MergeExclusive<
    DynamicViewStep<A>,
    DynamicViewParallelSteps<A>
  >
>

export type DynamicViewIncludeRule<A extends AnyAux = Any> = {
  include: ModelFqnExpr.Any<A>[]
}

export type DynamicViewRule<A extends AnyAux = Any> =
  | DynamicViewIncludeRule<A>
  | ViewRuleGlobalPredicateRef
  | ViewRuleStyle<A>
  | ViewRuleGlobalStyle
  | ViewRuleAutoLayout
export interface DynamicView<A extends AnyAux = Any> extends BasicView<A> {
  readonly __: 'dynamic'
  readonly steps: DynamicViewStepOrParallel<A>[]
  readonly rules: DynamicViewRule<A>[]
}

export function isDynamicViewParallelSteps<A extends AnyAux>(
  step: DynamicViewStepOrParallel<A>,
): step is DynamicViewParallelSteps<A> {
  return '__parallel' in step && isArray(step.__parallel)
}

export type CustomColorDefinitions = { [key: string]: ThemeColorValues }

export type DeploymentViewRulePredicate<A extends AnyAux = Any> =
  | {
    include: Expression<A>[]
    exclude?: never
  }
  | {
    include?: never
    exclude: Expression<A>[]
  }
export type DeploymentViewRuleStyle<A extends AnyAux = Any> = {
  targets: FqnExpr<A>[]
  notation?: string
  style: ElementStyle & {
    color?: Color
    shape?: ElementShape
    icon?: Icon
  }
}
export type DeploymentViewRule<A extends AnyAux = Any> =
  | DeploymentViewRulePredicate<A>
  | ViewRuleAutoLayout
  | DeploymentViewRuleStyle<A>

export interface DeploymentView<A extends AnyAux = Any> extends BasicView<A> {
  readonly __: 'deployment'
  readonly rules: DeploymentViewRule<A>[]
}

export type LikeC4View<A extends AnyAux = Any> =
  | ScopedElementView<A>
  | ExtendsElementView<A>
  | UnscopedElementView<A>
  | DeploymentView<A>
  | DynamicView<A>

export function isDeploymentView<A extends AnyAux>(view: LikeC4View<A>): view is DeploymentView<A> {
  return view.__ === 'deployment'
}

export function isDynamicView<A extends AnyAux>(view: LikeC4View<A>): view is DynamicView<A> {
  return view.__ === 'dynamic'
}

export function isElementView<A extends AnyAux>(view: LikeC4View<A>): view is ElementView<A> {
  return !('__' in view) || view.__ === 'element'
}

export function isExtendsElementView<A extends AnyAux>(view: LikeC4View<A>): view is ExtendsElementView<A> {
  return isElementView(view) && 'extends' in view
}

export function isScopedElementView<A extends AnyAux>(view: LikeC4View<A>): view is ScopedElementView<A> {
  return isElementView(view) && 'viewOf' in view
}

// Get the prefix of the parallel steps
// i.e. step-01.1 -> step-01.
export function getParallelStepsPrefix(id: string): string | null {
  if (isStepEdgeId(id) && id.includes('.')) {
    return id.slice(0, id.indexOf('.') + 1)
  }
  return null
}

export interface ComputedNode<A extends AnyAux = Any> {
  id: Aux.Strict.NodeId<A>
  kind: Aux.ElementKind<A> | Aux.DeploymentKind<A> | typeof GroupElementKind
  parent: Aux.Strict.NodeId<A> | null
  /**
   * Reference to model element
   * If 1 - node id is a reference
   */
  modelRef?: 1 | Aux.Strict.Fqn<A>
  /**
   * Reference to deployment element
   * If 1 - node id is a reference
   */
  deploymentRef?: 1 | Aux.Strict.DeploymentFqn<A>
  title: string
  description: string | null
  technology: string | null
  notation?: string
  tags: Aux.Tags<A> | null
  links?: readonly Link[] | null
  children: Aux.Strict.NodeId<A>[]
  inEdges: Aux.Strict.EdgeId<A>[]
  outEdges: Aux.Strict.EdgeId<A>[]
  shape: ElementShape
  color: Color
  icon?: Icon
  style: ElementStyle
  navigateTo?: Aux.Strict.ViewId<A> | null
  level: number
  // For compound nodes, the max depth of nested nodes
  depth?: number
  /**
   * If this node was customized in the view
   */
  isCustomized?: boolean
}
export namespace ComputedNode {
  export function modelRef<A extends AnyAux>(node: ComputedNode<A>): Aux.Strict.Fqn<A> | null {
    return node.modelRef === 1 ? node.id as unknown as Aux.Strict.Fqn<A> : (node.modelRef ?? null)
  }
  export function deploymentRef<A extends AnyAux>(node: ComputedNode<A>): Aux.Strict.DeploymentFqn<A> | null {
    return node.deploymentRef === 1 ? node.id as unknown as Aux.Strict.DeploymentFqn<A> : (node.deploymentRef ?? null)
  }
  /**
   * Nodes group is a special kind of node, exisiting only in view
   */
  export function isNodesGroup(node: ComputedNode<any>): boolean {
    return node.kind === GroupElementKind
  }
}

export interface ComputedEdge<A extends AnyAux = Any> {
  id: Aux.Strict.EdgeId<A>
  parent: Aux.Strict.NodeId<A> | null
  source: Aux.Strict.NodeId<A>
  target: Aux.Strict.NodeId<A>
  label: string | null
  description?: string
  technology?: string
  relations: Aux.Strict.RelationId<A>[]
  kind?: Aux.RelationKind<A>
  notation?: string
  // Notes for walkthrough
  notes?: string
  color?: Color
  line?: RelationshipLineType
  head?: RelationshipArrowType
  tail?: RelationshipArrowType
  tags?: Aux.Tags<A> | null
  // Link to dynamic view
  navigateTo?: Aux.Strict.ViewId<A>
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

export interface ViewWithHash {
  /**
   * Hash of the view object.
   * This is used to detect changes in layout
   */
  hash: string
}

export interface ViewWithNotation {
  notation?: {
    elements: ElementNotation[]
  }
}
export interface ViewAutoLayout {
  direction: ViewRuleAutoLayout['direction']
  rankSep?: number
  nodeSep?: number
}
export interface ComputedElementView<A extends AnyAux = Any>
  extends Omit<ElementView<A>, 'rules' | 'docUri'>, ViewWithHash, ViewWithNotation
{
  readonly viewOf?: Aux.Strict.Fqn<A>
  readonly extends?: Aux.Strict.ViewId<A>
  readonly autoLayout: ViewAutoLayout
  readonly nodes: ComputedNode<A>[]
  readonly edges: ComputedEdge<A>[]
  rules?: never
  docUri?: never
}
export interface ComputedDynamicView<A extends AnyAux = Any>
  extends Omit<DynamicView<A>, 'rules' | 'steps' | 'docUri'>, ViewWithHash, ViewWithNotation
{
  readonly autoLayout: ViewAutoLayout
  readonly nodes: ComputedNode<A>[]
  readonly edges: ComputedEdge<A>[]
  steps?: never
  rules?: never
  docUri?: never
}

export interface ComputedDeploymentView<A extends AnyAux = Any>
  extends Omit<DeploymentView<A>, 'rules' | 'docUri'>, ViewWithHash, ViewWithNotation
{
  readonly autoLayout: ViewAutoLayout
  readonly nodes: ComputedNode<A>[]
  readonly edges: ComputedEdge<A>[]
  rules?: never
  docUri?: never
}

export type ComputedView<A extends AnyAux = Any> =
  | ComputedElementView<A>
  | ComputedDeploymentView<A>
  | ComputedDynamicView<A>

export namespace ComputedView {
  export function isDeployment<A extends AnyAux>(view: ComputedView<A>): view is ComputedDeploymentView<A> {
    return view.__ === 'deployment'
  }
  export function isDynamic<A extends AnyAux>(view: ComputedView<A>): view is ComputedDynamicView<A> {
    return view.__ === 'dynamic'
  }
  export function isElement<A extends AnyAux>(view: ComputedView<A>): view is ComputedElementView<A> {
    return !('__' in view) || view.__ === 'element'
  }
}

// Bounding box
export type BBox = {
  x: number
  y: number
  width: number
  height: number
}

export function getBBoxCenter({
  x,
  y,
  width,
  height,
}: BBox): XYPoint {
  return {
    x: x + width / 2,
    y: y + height / 2,
  }
}

export interface DiagramNode<A extends AnyAux = Any> extends ComputedNode<A> {
  width: number
  height: number
  // Absolute position, top left
  position: Point
  labelBBox: BBox
}

export namespace DiagramNode {
  export function modelRef<A extends AnyAux>(node: Pick<DiagramNode<A>, 'id' | 'modelRef'>): Aux.Strict.Fqn<A> | null {
    return node.modelRef === 1 ? node.id as unknown as Aux.Strict.Fqn<A> : (node.modelRef ?? null)
  }
  export function deploymentRef<A extends AnyAux>(
    node: Pick<DiagramNode<A>, 'id' | 'deploymentRef'>,
  ): Aux.Strict.DeploymentFqn<A> | null {
    return node.deploymentRef === 1 ? node.id as unknown as Aux.Strict.DeploymentFqn<A> : (node.deploymentRef ?? null)
  }
  /**
   * Nodes group is a special kind of node, exisiting only in view
   */
  export function isNodesGroup(node: Pick<DiagramNode<any>, 'kind'>): boolean {
    return node.kind === GroupElementKind
  }
}

export interface DiagramEdge<A extends AnyAux = Any> extends ComputedEdge<A> {
  // Bezier points
  points: NonEmptyArray<Point>
  // Control points to adjust the edge
  controlPoints?: NonEmptyArray<XYPoint>
  labelBBox?: BBox | null
  // Graphviz edge POS
  // TODO: temporary solution, should be moved out
  dotpos?: string
}

export interface DiagramView<A extends AnyAux = Any> extends Omit<ComputedView<A>, 'nodes' | 'edges' | 'manualLayout'> {
  readonly nodes: DiagramNode<A>[]
  readonly edges: DiagramEdge<A>[]
  readonly bounds: BBox

  /**
   * If diagram has manual layout
   * But was changed and layout should be recalculated
   */
  hasLayoutDrift?: boolean
  // Should not exist in DiagramView
  manualLayout?: never
}

export type ViewManualLayout = {
  // Object hash of previous layout
  readonly hash: string
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly autoLayout: ViewAutoLayout
  readonly nodes: Record<string, {
    isCompound: boolean
    x: number
    y: number
    width: number
    height: number
  }>
  readonly edges: Record<string, {
    // Graphviz edge POS
    dotpos?: string
    // Bezier points
    points: NonEmptyArray<Point>
    // Control points to adjust the edge
    controlPoints?: NonEmptyArray<XYPoint>
    labelBBox?: BBox
  }>
}

export type ProcessedView<A extends AnyAux = Any> = ComputedView<A> | DiagramView<A>
