import type { NonEmptyArray } from './_common'
import type * as aux from './aux'
import type { AnyAux } from './aux'
import type { _stage } from './const'

import type { BBox, Point, XYPoint } from './geometry'
import type { GlobalPredicateId, GlobalStyleID } from './global'
import * as scalar from './scalar'
import type {
  BorderStyle,
  Color,
  ElementShape,
  ShapeSize,
  SpacingSize,
  TextSize,
} from './styles'

export interface AnyIncludePredicate<Expr> {
  include: Expr[]
  exclude?: never
}
export interface AnyExcludePredicate<Expr> {
  include?: never
  exclude: Expr[]
}

export interface AnyViewRuleStyle<Expr> {
  targets: Expr[]
  notation?: string
  style: {
    border?: BorderStyle
    opacity?: number
    multiple?: boolean
    size?: ShapeSize
    padding?: SpacingSize
    textSize?: TextSize
    color?: Color
    shape?: ElementShape
    icon?: scalar.Icon
  }
}

export interface ViewRuleGlobalStyle {
  styleId: GlobalStyleID
}
export function isViewRuleGlobalStyle(rule: object): rule is ViewRuleGlobalStyle {
  return 'styleId' in rule
}

export interface ViewRuleGlobalPredicateRef {
  predicateId: GlobalPredicateId
}
export function isViewRuleGlobalPredicateRef(rule: object): rule is ViewRuleGlobalPredicateRef {
  return 'predicateId' in rule
}

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

export interface ViewAutoLayout {
  direction: ViewRuleAutoLayout['direction']
  rankSep?: number
  nodeSep?: number
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

export type ViewType = 'element' | 'dynamic' | 'deployment'

export interface BaseViewProperties<A extends AnyAux> extends aux.WithOptionalTags<A>, aux.WithOptionalLinks {
  readonly id: aux.StrictViewId<A>
  readonly title: string | null
  readonly description: scalar.MarkdownOrString | null
  /**
   * For all views we find common ancestor path.
   * This is used to generate relative paths, i.e.:
   * - "/home/project/index.c4" becomes "index.c4"
   * - "/home/project/subdir/views.c4" becomes "subdir/views.c4"
   *
   * Undefined if the view is auto-generated.
   */
  readonly relativePath?: string | undefined
}

export interface BaseParsedViewProperties<A extends AnyAux> extends BaseViewProperties<A> {
  /**
   * Internal field to identify the stage of the view.
   * This is used to create the correct type of the view.
   */
  readonly [_stage]: 'parsed'
  /**
   * URI to the source file of this view.
   * Undefined if the view is auto-generated.
   */
  readonly docUri?: string | undefined

  /**
   * If the view is changed manually this field contains the layout data.
   */
  readonly manualLayout?: ViewManualLayout | undefined
}

export type NodeNotation = {
  kinds: string[]
  shape: ElementShape
  color: Color
  title: string
}

export interface ViewWithNotation {
  notation?: {
    nodes: NodeNotation[]
  }
}
export interface ViewWithHash {
  /**
   * Hash of the view object.
   * This is used to detect changes in layout
   */
  hash: string
}
