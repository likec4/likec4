import { isArray, isNullish } from 'remeda'
import type { Tagged } from 'type-fest'
import type { IconUrl, NonEmptyArray, Point, XYPoint } from './_common'
import type { DeploymentExpression } from './deployments'
import {
  type BorderStyle,
  ElementKind,
  type ElementShape,
  type ElementStyle,
  type Fqn,
  type Link,
  type Tag
} from './element'
import type { ElementExpression, ElementPredicateExpression, Expression } from './expression'
import type { GlobalPredicateId, GlobalStyleID } from './global'
import type { RelationId, RelationshipArrowType, RelationshipKind, RelationshipLineType } from './relation'
import type { Color, ThemeColorValues } from './theme'
import type { ElementNotation } from './view-notation'

export type ViewId<Id extends string = string> = Tagged<Id, 'ViewID'>

export type ViewRulePredicate =
  | {
    include: Expression[]
    exclude?: never
  }
  | {
    include?: never
    exclude: Expression[]
  }

export function isViewRulePredicate(rule: DeploymentViewRule): rule is DeploymentViewRulePredicate
export function isViewRulePredicate(rule: DynamicViewRule): rule is DynamicViewIncludeRule
export function isViewRulePredicate(rule: ViewRule): rule is ViewRulePredicate
export function isViewRulePredicate(rule: object) {
  return (
    ('include' in rule && Array.isArray(rule.include))
    || ('exclude' in rule && Array.isArray(rule.exclude))
  )
}

export interface ViewRuleGlobalPredicateRef {
  predicateId: GlobalPredicateId
}
export function isViewRuleGlobalPredicateRef(rule: ViewRule): rule is ViewRuleGlobalPredicateRef {
  return 'predicateId' in rule
}

export interface ViewRuleStyle {
  targets: ElementExpression[]
  notation?: string
  style: ElementStyle & {
    color?: Color
    shape?: ElementShape
    icon?: IconUrl
  }
}
export function isViewRuleStyle(rule: DeploymentViewRule): rule is DeploymentViewRuleStyle
export function isViewRuleStyle(rule: ViewRule): rule is ViewRuleStyle
export function isViewRuleStyle(rule: object) {
  return 'style' in rule && 'targets' in rule && Array.isArray(rule.targets)
}

export interface ViewRuleGlobalStyle {
  styleId: GlobalStyleID
}
export function isViewRuleGlobalStyle(rule: ViewRule): rule is ViewRuleGlobalStyle {
  return 'styleId' in rule
}

export type ViewRuleStyleOrGlobalRef = ViewRuleStyle | ViewRuleGlobalStyle

export type AutoLayoutDirection = 'TB' | 'BT' | 'LR' | 'RL'
export function isAutoLayoutDirection(autoLayout: unknown): autoLayout is AutoLayoutDirection {
  return autoLayout === 'TB' || autoLayout === 'BT' || autoLayout === 'LR' || autoLayout === 'RL'
}

export interface ViewRuleAutoLayout {
  direction: AutoLayoutDirection
  nodeSep?: number
  rankSep?: number
}
export function isViewRuleAutoLayout(rule: DeploymentViewRule): rule is ViewRuleAutoLayout
export function isViewRuleAutoLayout(rule: DynamicViewRule): rule is ViewRuleAutoLayout
export function isViewRuleAutoLayout(rule: ViewRule): rule is ViewRuleAutoLayout
export function isViewRuleAutoLayout(rule: object) {
  return 'direction' in rule
}

export interface ViewRuleGroup {
  groupRules: Array<ViewRulePredicate | ViewRuleGroup>
  title: string | null
  color?: Color
  border?: BorderStyle
  // 0-100
  opacity?: number
}

export function isViewRuleGroup(rule: ViewRule): rule is ViewRuleGroup {
  return 'title' in rule && 'groupRules' in rule && Array.isArray(rule.groupRules)
}

export type ViewRule =
  | ViewRulePredicate
  | ViewRuleGlobalPredicateRef
  | ViewRuleGroup
  | ViewRuleStyle
  | ViewRuleGlobalStyle
  | ViewRuleAutoLayout

export interface BasicView<
  ViewType extends 'element' | 'dynamic' | 'deployment',
  ViewIDs extends string,
  Tags extends string
> {
  readonly __?: ViewType
  readonly id: ViewId<ViewIDs>
  readonly title: string | null
  readonly description: string | null
  readonly tags: NonEmptyArray<Tag<Tags>> | null
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

export interface BasicElementView<ViewIDs extends string, Tags extends string>
  extends BasicView<'element', ViewIDs, Tags>
{
  readonly viewOf?: Fqn
  readonly rules: ViewRule[]
}
export interface ScopedElementView<ViewIDs extends string, Tags extends string>
  extends BasicElementView<ViewIDs, Tags>
{
  readonly viewOf: Fqn
}

export interface ExtendsElementView<ViewIDs extends string, Tags extends string>
  extends BasicElementView<ViewIDs, Tags>
{
  readonly extends: ViewId<ViewIDs>
}
export type ElementView<
  ViewIDs extends string = string,
  Tags extends string = string
> =
  | ScopedElementView<ViewIDs, Tags>
  | ExtendsElementView<ViewIDs, Tags>
  | BasicElementView<ViewIDs, Tags>

export interface DynamicViewStep {
  readonly source: Fqn
  readonly target: Fqn
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
  readonly navigateTo?: ViewId
  __parallel?: never
}

export interface DynamicViewParallelSteps {
  readonly __parallel: DynamicViewStep[]
}

export type DynamicViewStepOrParallel = DynamicViewStep | DynamicViewParallelSteps

export type DynamicViewIncludeRule = {
  include: ElementPredicateExpression[]
}

export type DynamicViewRule =
  | DynamicViewIncludeRule
  | ViewRuleGlobalPredicateRef
  | ViewRuleStyle
  | ViewRuleGlobalStyle
  | ViewRuleAutoLayout
export interface DynamicView<
  ViewIDs extends string = string,
  Tags extends string = string
> extends BasicView<'dynamic', ViewIDs, Tags> {
  readonly __: 'dynamic'

  readonly steps: DynamicViewStepOrParallel[]

  readonly rules: DynamicViewRule[]
}

export function isDynamicViewParallelSteps(step: DynamicViewStepOrParallel): step is DynamicViewParallelSteps {
  return '__parallel' in step && isArray(step.__parallel)
}

export type CustomColorDefinitions = { [key: string]: ThemeColorValues }

export type DeploymentViewRulePredicate =
  | {
    include: DeploymentExpression[]
    exclude?: never
  }
  | {
    include?: never
    exclude: DeploymentExpression[]
  }
export type DeploymentViewRuleStyle = {
  targets: DeploymentExpression[]
  notation?: string
  style: ElementStyle & {
    color?: Color
    shape?: ElementShape
    icon?: IconUrl
  }
}
export type DeploymentViewRule = DeploymentViewRulePredicate | ViewRuleAutoLayout | DeploymentViewRuleStyle

export interface DeploymentView<
  ViewIDs extends string = string,
  Tags extends string = string
> extends BasicView<'deployment', ViewIDs, Tags> {
  readonly __: 'deployment'
  readonly rules: DeploymentViewRule[]
}

export type LikeC4View<
  ViewIDs extends string = string,
  Tags extends string = string
> = ElementView<ViewIDs, Tags> | DynamicView<ViewIDs, Tags> | DeploymentView<ViewIDs, Tags>

export function isDeploymentView(view: LikeC4View): view is DeploymentView {
  return view.__ === 'deployment'
}
export function isDynamicView(view: LikeC4View): view is DynamicView {
  return view.__ === 'dynamic'
}
export function isElementView(view: LikeC4View): view is ElementView {
  return isNullish(view.__) || view.__ === 'element'
}

export function isExtendsElementView(view: LikeC4View): view is ExtendsElementView<string, string> {
  return isElementView(view) && 'extends' in view
}

export function isScopedElementView(view: LikeC4View): view is ScopedElementView<string, string> {
  return isElementView(view) && 'viewOf' in view
}

export type NodeId<IDs extends string = string> = Tagged<IDs, 'Fqn'>

export type EdgeId = Tagged<string, 'EdgeId'>
export type StepEdgeIdLiteral = `step-${number}` | `step-${number}.${number}`
export type StepEdgeId = Tagged<StepEdgeIdLiteral, 'EdgeId'>
export function StepEdgeId(step: number, parallelStep?: number): StepEdgeId {
  const id = `step-${String(step).padStart(2, '0')}` as StepEdgeId
  return parallelStep ? `${id}.${parallelStep}` as StepEdgeId : id
}

export function isStepEdgeId(id: string): id is StepEdgeId {
  return id.startsWith('step-')
}

export function extractStep(id: EdgeId): number {
  if (!isStepEdgeId(id)) {
    throw new Error(`Invalid step edge id: ${id}`)
  }
  return parseFloat(id.slice('step-'.length))
}

// Get the prefix of the parallel steps
// i.e. step-01.1 -> step-01.
export function getParallelStepsPrefix(id: string): string | null {
  if (isStepEdgeId(id) && id.includes('.')) {
    return id.slice(0, id.indexOf('.') + 1)
  }
  return null
}

export interface ComputedNode {
  id: NodeId
  kind: string // TODO: fix ElementKind | DeploymentNodeKind
  parent: NodeId | null
  /**
   * Reference to model element
   * If 1 - node id is a reference
   */
  modelRef?: 1 | Fqn
  /**
   * Reference to deployment element
   * If 1 - node id is a reference
   */
  deploymentRef?: 1 | Fqn
  title: string
  description: string | null
  technology: string | null
  notation?: string
  tags: NonEmptyArray<Tag> | null
  links: NonEmptyArray<Link> | null
  children: NodeId[]
  inEdges: EdgeId[]
  outEdges: EdgeId[]
  shape: ElementShape
  color: Color
  /**
   * @deprecated Use `style` instead
   */
  icon?: IconUrl
  style: ElementStyle
  navigateTo?: ViewId
  level: number
  // For compound nodes, the max depth of nested nodes
  depth?: number
  /**
   * If this node was customized in the view
   */
  isCustomized?: boolean
}
export namespace ComputedNode {
  export function modelRef(node: ComputedNode): Fqn | null {
    return node.modelRef === 1 ? node.id : (node.modelRef ?? null)
  }
  export function deploymentRef(node: ComputedNode): Fqn | null {
    return node.deploymentRef === 1 ? node.id : (node.deploymentRef ?? null)
  }
  /**
   * Nodes group is a special kind of node, exisiting only in view
   */
  export function isNodesGroup(node: ComputedNode): boolean {
    return node.kind === ElementKind.Group
  }
}

export interface ComputedEdge {
  id: EdgeId
  parent: NodeId | null
  source: NodeId
  target: NodeId
  label: string | null
  description?: string
  technology?: string
  relations: RelationId[]
  kind?: RelationshipKind
  notation?: string
  // Notes for walkthrough
  notes?: string
  color?: Color
  line?: RelationshipLineType
  head?: RelationshipArrowType
  tail?: RelationshipArrowType
  tags?: NonEmptyArray<Tag>
  // Link to dynamic view
  navigateTo?: ViewId
  /**
   * If this edge is derived from custom relationship predicate
   */
  isCustomized?: boolean
  /**
   * For layouting purposes
   * @default 'forward'
   */
  dir?: 'forward' | 'back'
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
export interface ComputedElementView<
  ViewIDs extends string = string,
  Tags extends string = string
> extends Omit<ElementView<ViewIDs, Tags>, 'rules' | 'docUri'>, ViewWithHash, ViewWithNotation {
  readonly extends?: ViewId<ViewIDs>
  readonly autoLayout: ViewAutoLayout
  readonly nodes: ComputedNode[]
  readonly edges: ComputedEdge[]
  rules?: never
  docUri?: never
}
export interface ComputedDynamicView<
  ViewIDs extends string = string,
  Tags extends string = string
> extends Omit<DynamicView<ViewIDs, Tags>, 'rules' | 'steps' | 'docUri'>, ViewWithHash, ViewWithNotation {
  readonly autoLayout: ViewAutoLayout
  readonly nodes: ComputedNode[]
  readonly edges: ComputedEdge[]
  steps?: never
  rules?: never
  docUri?: never
}

export interface ComputedDeploymentView<
  ViewIDs extends string = string,
  Tags extends string = string
> extends Omit<DeploymentView<ViewIDs, Tags>, 'rules' | 'docUri'>, ViewWithHash, ViewWithNotation {
  readonly autoLayout: ViewAutoLayout
  readonly nodes: ComputedNode[]
  readonly edges: ComputedEdge[]
  rules?: never
  docUri?: never
}

export type ComputedView<
  ViewIDs extends string = string,
  Tags extends string = string
> = ComputedElementView<ViewIDs, Tags> | ComputedDynamicView<ViewIDs, Tags> | ComputedDeploymentView<ViewIDs, Tags>

export namespace ComputedView {
  export function isDeployment(view: ComputedView): view is ComputedDeploymentView {
    return view.__ === 'deployment'
  }
  export function isDynamic(view: ComputedView): view is ComputedDynamicView {
    return view.__ === 'dynamic'
  }
  export function isElement(view: ComputedView): view is ComputedElementView {
    return isNullish(view.__) || view.__ === 'element'
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
  height
}: BBox): XYPoint {
  return {
    x: x + width / 2,
    y: y + height / 2
  }
}

export interface DiagramNode extends ComputedNode {
  width: number
  height: number
  // Absolute position, top left
  position: Point
  labelBBox: BBox
}

export namespace DiagramNode {
  export function modelRef(node: DiagramNode): Fqn | null {
    return node.modelRef === 1 ? node.id : (node.modelRef ?? null)
  }
  export function deploymentRef(node: DiagramNode): Fqn | null {
    return node.deploymentRef === 1 ? node.id : (node.deploymentRef ?? null)
  }
  /**
   * Nodes group is a special kind of node, exisiting only in view
   */
  export function isNodesGroup(node: DiagramNode): boolean {
    return node.kind === ElementKind.Group
  }
}

export interface DiagramEdge extends ComputedEdge {
  // Bezier points
  points: NonEmptyArray<Point>
  // Control points to adjust the edge
  controlPoints?: NonEmptyArray<XYPoint>
  labelBBox?: BBox | null
  // Graphviz edge POS
  // TODO: temporary solution, should be moved out
  dotpos?: string
}

export interface DiagramView<
  ViewIDs extends string = string,
  Tags extends string = string
> extends Omit<ComputedView<ViewIDs, Tags>, 'nodes' | 'edges' | 'manualLayout'> {
  readonly nodes: DiagramNode[]
  readonly edges: DiagramEdge[]
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
