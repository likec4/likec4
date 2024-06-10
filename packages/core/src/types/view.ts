import { isNullish } from 'remeda'
import type { IconUrl, NonEmptyArray } from './_common'
import type { ElementKind, ElementShape, ElementStyle, Fqn, Tag } from './element'
import type { CustomElementExpr, ElementExpression, Expression } from './expression'
import type { Opaque } from './opaque'
import type { RelationID, RelationshipArrowType, RelationshipLineType } from './relation'
import type { ColorLiteral, ThemeColor } from './theme'

// Full-qualified-name
export type ViewID = Opaque<string, 'ViewID'>

export type ViewRuleExpression =
  | {
    include: Expression[]
    exclude?: never
  }
  | {
    include?: never
    exclude: Expression[]
  }
export function isViewRuleExpression(rule: ViewRule): rule is ViewRuleExpression {
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

export type ViewRule = ViewRuleExpression | ViewRuleStyle | ViewRuleAutoLayout

export interface BasicView<ViewType extends 'element' | 'dynamic' = 'element' | 'dynamic'> {
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
   * - "" for views in the common ancestor directory (or root)
   * - "subdir" for views in "<root>/subdir"
   * - "subdir/subdir1" for views in "<root>/subdir/subdir1"
   *
   * Undefined if the view is auto-generated.
   */
  readonly relativePath?: string
}

export interface BasicElementView extends BasicView<'element'> {
  readonly viewOf?: Fqn
  readonly rules: ViewRule[]
}
export interface StrictElementView extends BasicElementView {
  readonly viewOf: Fqn
}

export interface ExtendsElementView extends BasicElementView {
  readonly extends: ViewID
}
export type ElementView = StrictElementView | ExtendsElementView | BasicElementView

export interface DynamicViewStep {
  readonly source: Fqn
  readonly target: Fqn
  readonly title: string | null
  readonly isBackward?: boolean
}

export type DynamicViewIncludeRule = {
  include: (ElementExpression | CustomElementExpr)[]
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

export type View = ElementView | DynamicView

export function isDynamicView(view: View): view is DynamicView {
  return view.__ === 'dynamic'
}
export function isElementView(view: View): view is ElementView {
  return isNullish(view.__) || view.__ === 'element'
}

export function isExtendsElementView(view: View): view is ExtendsElementView {
  return isElementView(view) && 'extends' in view
}

export function isStrictElementView(view: View): view is StrictElementView {
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
}

export interface ComputedEdge {
  id: EdgeId
  parent: NodeId | null
  source: NodeId
  target: NodeId
  label: string | null
  relations: RelationID[]
  color?: ThemeColor
  line?: RelationshipLineType
  head?: RelationshipArrowType
  tail?: RelationshipArrowType

  /**
   * For layouting purposes
   * @default 'forward'
   */
  dir?: 'forward' | 'back'
}

export interface ComputedElementView extends Omit<ElementView, 'rules'> {
  readonly extends?: ViewID
  readonly autoLayout: ViewRuleAutoLayout['autoLayout']
  readonly nodes: ComputedNode[]
  readonly edges: ComputedEdge[]
}
export interface ComputedDynamicView extends Omit<DynamicView, 'rules' | 'steps'> {
  readonly autoLayout: ViewRuleAutoLayout['autoLayout']
  readonly nodes: ComputedNode[]
  readonly edges: ComputedEdge[]
}
export function isComputedDynamicView(view: ComputedView): view is ComputedDynamicView {
  return view.__ === 'dynamic'
}

export type ComputedView = ComputedElementView | ComputedDynamicView

export function isComputedElementView(view: ComputedView): view is ComputedElementView {
  return isNullish(view.__) || view.__ === 'element'
}

export type Point = readonly [x: number, y: number]

// Bounding box
export type BBox = {
  x: number
  y: number
  width: number
  height: number
}

export interface DiagramLabel {
  align: 'left' | 'right' | 'center'
  fontStyle?: 'bold' | 'normal'
  color?: ColorLiteral
  fontSize: number
  pt: Point
  width: number
  text: string
}

export interface DiagramNode extends ComputedNode {
  width: number
  height: number
  position: Point // Absolute position, top left
  // relative: Point // Top left, relative to parent
  labels: DiagramLabel[]
}

export interface DiagramEdge extends ComputedEdge {
  points: NonEmptyArray<Point>
  // Polygons are used to draw arrows
  headArrow?: NonEmptyArray<Point>
  // Draw arrow from the last point of the edge to this point
  headArrowPoint?: Point
  tailArrow?: NonEmptyArray<Point>
  // Draw arrow from the first point of the edge to this point
  tailArrowPoint?: Point
  labels?: NonEmptyArray<DiagramLabel>
  labelBBox?: BBox
}

export interface DiagramView extends Omit<ComputedView, 'nodes' | 'edges'> {
  readonly nodes: DiagramNode[]
  readonly edges: DiagramEdge[]
  readonly width: number
  readonly height: number
}
