import { isArray, isNullish } from 'remeda'
import type { Tagged } from 'type-fest'
import type { IconUrl, NonEmptyArray, Point, XYPoint } from './_common'
import type { ElementKind, ElementShape, ElementStyle, Fqn, Link, Tag } from './element'
import type { ElementExpression, ElementPredicateExpression, Expression } from './expression'
import type { RelationID, RelationshipArrowType, RelationshipKind, RelationshipLineType } from './relation'
import type { Color, ThemeColorValues } from './theme'
import type { ElementNotation } from './view-notation'

// Full-qualified-name
export type ViewID = Tagged<string, 'ViewID'>

export type ViewRulePredicate =
  | {
    include: Expression[]
    exclude?: never
  }
  | {
    include?: never
    exclude: Expression[]
  }
export function isViewRulePredicate(rule: ViewRule): rule is ViewRulePredicate {
  return (
    ('include' in rule && Array.isArray(rule.include))
    || ('exclude' in rule && Array.isArray(rule.exclude))
  )
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
export function isViewRuleStyle(rule: ViewRule): rule is ViewRuleStyle {
  return 'style' in rule && 'targets' in rule
}

export type AutoLayoutDirection = 'TB' | 'BT' | 'LR' | 'RL'
export interface ViewRuleAutoLayout {
  autoLayout: AutoLayoutDirection
}
export function isViewRuleAutoLayout(rule: ViewRule): rule is ViewRuleAutoLayout {
  return 'autoLayout' in rule
}

export type ViewRule = ViewRulePredicate | ViewRuleStyle | ViewRuleAutoLayout

export interface BasicView<ViewType extends 'element' | 'dynamic'> {
  readonly __?: ViewType
  readonly id: ViewID
  readonly title: string | null
  readonly description: string | null
  readonly tags: NonEmptyArray<Tag> | null
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

export interface BasicElementView extends BasicView<'element'> {
  readonly viewOf?: Fqn
  readonly rules: ViewRule[]
}
export interface ScopedElementView extends BasicElementView {
  readonly viewOf: Fqn
}

export interface ExtendsElementView extends BasicElementView {
  readonly extends: ViewID
}
export type ElementView = ScopedElementView | ExtendsElementView | BasicElementView

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
  readonly navigateTo?: ViewID
  __parallel?: never
}

export interface DynamicViewParallelSteps {
  readonly __parallel: DynamicViewStep[]
}

export type DynamicViewStepOrParallel = DynamicViewStep | DynamicViewParallelSteps

export type DynamicViewIncludeRule = {
  include: ElementPredicateExpression[]
}

export function isDynamicViewIncludeRule(rule: DynamicViewRule): rule is DynamicViewIncludeRule {
  return 'include' in rule && Array.isArray(rule.include)
}

export type DynamicViewRule = DynamicViewIncludeRule | ViewRuleStyle | ViewRuleAutoLayout
export interface DynamicView extends BasicView<'dynamic'> {
  readonly __: 'dynamic'

  readonly steps: DynamicViewStepOrParallel[]

  readonly rules: DynamicViewRule[]
}

export function isDynamicViewParallelSteps(step: DynamicViewStepOrParallel): step is DynamicViewParallelSteps {
  return '__parallel' in step && isArray(step.__parallel)
}

export type CustomColorDefinitions = { [key: string]: ThemeColorValues }

export type LikeC4View = ElementView | DynamicView

export function isDynamicView(view: LikeC4View): view is DynamicView {
  return view.__ === 'dynamic'
}
export function isElementView(view: LikeC4View): view is ElementView {
  return isNullish(view.__) || view.__ === 'element'
}

export function isExtendsElementView(view: LikeC4View): view is ExtendsElementView {
  return isElementView(view) && 'extends' in view
}

export function isScopedElementView(view: LikeC4View): view is ScopedElementView {
  return isElementView(view) && 'viewOf' in view
}

export type NodeId = Tagged<string, 'Fqn'>

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
  kind: ElementKind
  parent: NodeId | null
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
  /**
   * @deprecated Use `style` instead
   */
  color: Color
  /**
   * @deprecated Use `style` instead
   */
  icon?: IconUrl
  style: ElementStyle
  navigateTo?: ViewID
  level: number
  // For compound nodes, the max depth of nested nodes
  depth?: number
  /**
   * If this node was customized in the view
   */
  isCustomized?: boolean
}

export interface ComputedEdge {
  id: EdgeId
  parent: NodeId | null
  source: NodeId
  target: NodeId
  label: string | null
  description?: string
  technology?: string
  relations: RelationID[]
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
  navigateTo?: ViewID
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

export interface ComputedElementView extends Omit<ElementView, 'rules' | 'docUri'>, ViewWithHash, ViewWithNotation {
  readonly extends?: ViewID
  readonly autoLayout: ViewRuleAutoLayout['autoLayout']
  readonly nodes: ComputedNode[]
  readonly edges: ComputedEdge[]
  rules?: never
  docUri?: never
}
export interface ComputedDynamicView
  extends Omit<DynamicView, 'rules' | 'steps' | 'docUri'>, ViewWithHash, ViewWithNotation
{
  readonly autoLayout: ViewRuleAutoLayout['autoLayout']
  readonly nodes: ComputedNode[]
  readonly edges: ComputedEdge[]
  steps?: never
  rules?: never
  docUri?: never
}
export function isComputedDynamicView(view: ComputedView): view is ComputedDynamicView {
  return view.__ === 'dynamic'
}

export type ComputedView = ComputedElementView | ComputedDynamicView

export function isComputedElementView(view: ComputedView): view is ComputedElementView {
  return isNullish(view.__) || view.__ === 'element'
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

export interface DiagramView extends Omit<ComputedView, 'nodes' | 'edges' | 'manualLayout'> {
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
  readonly autoLayout: AutoLayoutDirection
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
