import type { ExclusiveUnion } from './_common'
import type * as aux from './aux'
import type { AnyAux } from './aux'
import type { _type } from './const'
import type { ModelExpression, ModelFqnExpr } from './expression-model'
import type { BorderStyle, Color, ShapeSize, SpacingSize, TextSize } from './styles'
import type {
  AnyExcludePredicate,
  AnyIncludePredicate,
  AnyViewRuleStyle,
  BaseParsedViewProperties,
  ViewRuleAutoLayout,
  ViewRuleGlobalPredicateRef,
  ViewRuleGlobalStyle,
} from './view-common'

/**
 * Predicates scoped to logical model
 */
export interface ElementViewIncludePredicate<A extends AnyAux = AnyAux>
  extends AnyIncludePredicate<ModelExpression<A>>
{}
export interface ElementViewExcludePredicate<A extends AnyAux = AnyAux>
  extends AnyExcludePredicate<ModelExpression<A>>
{}

export type ElementViewPredicate<A extends AnyAux = AnyAux> =
  | ElementViewIncludePredicate<A>
  | ElementViewExcludePredicate<A>

export interface ElementViewRuleGroup<A extends AnyAux = AnyAux> {
  groupRules: Array<ElementViewPredicate<A> | ElementViewRuleGroup<A>>
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

export function isViewRuleGroup<A extends AnyAux>(rule: ElementViewRule<A>): rule is ElementViewRuleGroup<A> {
  return 'title' in rule && 'groupRules' in rule && Array.isArray(rule.groupRules)
}

export interface ElementViewRuleStyle<A extends AnyAux = AnyAux> extends AnyViewRuleStyle<ModelFqnExpr<A>> {}

export type ElementViewRule<A extends AnyAux = AnyAux> = ExclusiveUnion<{
  IncludePredicate: ElementViewIncludePredicate<A>
  ExcludePredicate: ElementViewExcludePredicate<A>
  Group: ElementViewRuleGroup<A>
  Style: ElementViewRuleStyle<A>
  GlobalStyle: ViewRuleGlobalStyle
  GlobalPredicateRef: ViewRuleGlobalPredicateRef
  AutoLayout: ViewRuleAutoLayout
}>

export interface ParsedElementView<A extends AnyAux = AnyAux> extends BaseParsedViewProperties<A> {
  [_type]: 'element'
  readonly rules: ElementViewRule<A>[]
  readonly viewOf?: aux.StrictFqn<A>
  readonly extends?: aux.StrictViewId<A>
}
