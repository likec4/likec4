import type * as aux from './_aux'
import type { AnyAux } from './_aux'
import type { _stage } from './const'

import type { GlobalPredicateId, GlobalStyleID } from './global'
import type * as scalar from './scalar'
import type {
  BorderStyle,
  Color,
  ElementShape,
  IconPosition,
  IconSize,
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
    /**
     * If true, the element is rendered as multiple shapes.
     * @default false
     */
    multiple?: boolean
    size?: ShapeSize
    padding?: SpacingSize
    textSize?: TextSize
    color?: Color
    shape?: ElementShape
    icon?: scalar.Icon
    iconColor?: Color
    iconSize?: IconSize
    iconPosition?: IconPosition
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

export type RankValue = 'max' | 'min' | 'same' | 'sink' | 'source'

export interface ViewRuleRank<Expr> {
  targets: Expr[]
  rank: RankValue
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

export type ViewType = 'element' | 'dynamic' | 'deployment'

/**
 * The routing mode for relationships in a view:
 * - `spline`: curved edges, the built-in default.
 * - `ortho`: horizontal and vertical segments with right-angle bends.
 */
export type EdgeRouting = 'spline' | 'ortho'

export interface BaseViewProperties<A extends AnyAux> extends aux.WithOptionalTags<A>, aux.WithOptionalLinks {
  readonly id: aux.StrictViewId<A>
  readonly title: string | null
  readonly description: scalar.MarkdownOrString | null
  /**
   * Optional per-view navigation order.
   */
  readonly order?: number
  /**
   * The view's routing mode, inherited from the project default when omitted in source.
   * The view property takes precedence over the last `autoLayout` rule's routing parameter.
   * Computed and layouted views include this field only when the resolved value is `ortho`.
   */
  readonly routing?: EdgeRouting
  /**
   * Source file containing this view, relative to the project root.
   * Undefined if the view is auto-generated.
   */
  readonly sourcePath?: string | undefined
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
