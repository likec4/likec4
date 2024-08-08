import { isNullish } from 'remeda'
import type { IconUrl, NonEmptyArray, Point, XYPoint } from './_common'
import type { ElementKind, ElementShape, ElementStyle, Fqn, Tag } from './element'
import type { ElementExpression, ElementPredicateExpression, Expression } from './expression'
import type { Opaque } from './opaque'
import type { RelationID, RelationshipArrowType, RelationshipLineType } from './relation'
import type { ThemeColor } from './theme'

// Full-qualified-name
export type ViewID = Opaque<string, 'ViewID'>

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
  style: ElementStyle & {
    color?: ThemeColor
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
  readonly links: NonEmptyArray<string> | null

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
  readonly color?: ThemeColor
  readonly line?: RelationshipLineType
  readonly head?: RelationshipArrowType
  readonly tail?: RelationshipArrowType
  readonly isBackward?: boolean
}

export type DynamicViewIncludeRule = {
  include: ElementPredicateExpression[]
}

export function isDynamicViewIncludeRule(rule: DynamicViewRule): rule is DynamicViewIncludeRule {
  return 'include' in rule && Array.isArray(rule.include)
}

export type DynamicViewRule = DynamicViewIncludeRule | ViewRuleStyle | ViewRuleAutoLayout
export interface DynamicView extends BasicView<'dynamic'> {
  readonly __: 'dynamic'

  readonly steps: DynamicViewStep[]

  readonly rules: DynamicViewRule[]
}

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

export type NodeId = Fqn

export type EdgeId = Opaque<string, 'EdgeId'>
export type StepEdgeIdLiteral = `step-${number}`
export type StepEdgeId = Opaque<StepEdgeIdLiteral, 'EdgeId'>
export function StepEdgeId(step: number): StepEdgeId {
  return `step-${String(step).padStart(3, '0')}` as StepEdgeId
}

export function isStepEdgeId(id: string): id is StepEdgeId {
  return id.startsWith('step-')
}
export function extractStep(id: EdgeId): number {
  if (!isStepEdgeId(id)) {
    throw new Error(`Invalid step edge id: ${id}`)
  }
  return Number(id.slice('step-'.length))
}

export interface ComputedNode {
  id: NodeId
  kind: ElementKind
  parent: NodeId | null
  title: string
  description: string | null
  technology: string | null
  tags: NonEmptyArray<Tag> | null
  links: NonEmptyArray<string> | null
  children: NodeId[]
  inEdges: EdgeId[]
  outEdges: EdgeId[]
  shape: ElementShape
  /**
   * @deprecated Use `style` instead
   */
  color: ThemeColor
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
  color?: ThemeColor
  line?: RelationshipLineType
  head?: RelationshipArrowType
  tail?: RelationshipArrowType
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

export interface ComputedElementView extends Omit<ElementView, 'rules' | 'docUri'> {
  readonly extends?: ViewID
  readonly autoLayout: ViewRuleAutoLayout['autoLayout']
  readonly nodes: ComputedNode[]
  readonly edges: ComputedEdge[]
  rules?: never
  docUri?: never

  /**
   * Hash of the view object.
   * This is used to detect changes in layout
   */
  hash: string
}
export interface ComputedDynamicView extends Omit<DynamicView, 'rules' | 'steps' | 'docUri'> {
  readonly autoLayout: ViewRuleAutoLayout['autoLayout']
  readonly nodes: ComputedNode[]
  readonly edges: ComputedEdge[]
  steps?: never
  rules?: never
  docUri?: never

  /**
   * Hash of the view object.
   * This is used to detect changes in layout
   */
  hash: string
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
