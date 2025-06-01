import type { MergeExclusive, Simplify } from 'type-fest'
import type * as aux from './aux'
import type { AnyAux, Unknown } from './aux'
import type { ModelExpression, ModelFqnExpr } from './expression-model'
import type { BorderStyle, Color, ShapeSize, SpacingSize, TextSize } from './styles'
import type {
  AnyExcludePredicate,
  AnyIncludePredicate,
  AnyViewRuleStyle,
  ParsedViewBaseProperties,
  ViewRuleAutoLayout,
  ViewRuleGlobalStyle,
} from './view-common'

/**
 * Predicates scoped to logical model
 */
export interface ElementViewIncludePredicate<A extends AnyAux = Unknown>
  extends AnyIncludePredicate<ModelExpression<A>>
{}
export interface ElementViewExcludePredicate<A extends AnyAux = Unknown>
  extends AnyExcludePredicate<ModelExpression<A>>
{}

export type ElementViewPredicate<A extends AnyAux = Unknown> = Simplify<
  MergeExclusive<
    ElementViewIncludePredicate<A>,
    ElementViewExcludePredicate<A>
  >
>

export interface ElementViewRuleGroup<A extends AnyAux = Unknown> {
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

export function isElementViewRuleGroup<A extends AnyAux>(rule: ElementViewRule<A>): rule is ElementViewRuleGroup<A> {
  return 'title' in rule && 'groupRules' in rule && Array.isArray(rule.groupRules)
}

export interface ElementViewRuleStyle<A extends AnyAux = Unknown> extends AnyViewRuleStyle<ModelFqnExpr<A>> {}

export type ElementViewRule<A extends AnyAux = Unknown> =
  | ElementViewIncludePredicate<A>
  | ElementViewExcludePredicate<A>
  | ElementViewRuleGroup<A>
  | ElementViewRuleStyle<A>
  | ViewRuleAutoLayout
  | ViewRuleGlobalStyle

export interface ParsedElementView<A extends AnyAux = Unknown> extends ParsedViewBaseProperties<A, 'element'> {
  readonly rules: ElementViewRule<A>[]
  readonly viewOf?: aux.StrictFqn<A>
  readonly extends?: aux.StrictViewId<A>
}

export interface ScopedElementView<A extends AnyAux = AnyAux> extends Omit<ParsedElementView<A>, 'viewOf' | 'extends'> {
  readonly viewOf: aux.StrictFqn<A>
  readonly extends?: never
}

export interface ExtendsElementView<A extends AnyAux = AnyAux>
  extends Omit<ParsedElementView<A>, 'viewOf' | 'extends'>
{
  readonly viewOf?: never
  readonly extends: aux.StrictViewId<A>
}
