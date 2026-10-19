import type { AnyAux, Unknown } from './_aux'
import type { ExclusiveUnion } from './_common'
import type { _type } from './const'
import type { Expression, FqnExpr } from './expression'
import type {
  AnyExcludePredicate,
  AnyIncludePredicate,
  AnyViewRuleStyle,
  BaseParsedViewProperties,
  ViewRuleAutoLayout,
} from './view-common'
import type { ElementViewRuleGroup } from './view-parsed.element'

/**
 * Predicates scoped to deployment model
 */
export interface DeploymentViewIncludePredicate<A extends AnyAux = Unknown> extends AnyIncludePredicate<Expression<A>>
{}
export interface DeploymentViewExcludePredicate<A extends AnyAux = Unknown> extends AnyExcludePredicate<Expression<A>>
{}

export type DeploymentViewPredicate<A extends AnyAux = Unknown> =
  | DeploymentViewIncludePredicate<A>
  | DeploymentViewExcludePredicate<A>

export interface DeploymentViewRuleStyle<A extends AnyAux = Unknown> extends AnyViewRuleStyle<FqnExpr<A>> {}

export interface DeploymentViewRuleGroup<A extends AnyAux = Unknown> extends Omit<ElementViewRuleGroup<A>, 'groupRules'>
{
  groupRules: Array<DeploymentViewPredicate<A> | DeploymentViewRuleGroup<A>>
}

export type DeploymentViewRule<A extends AnyAux = Unknown> = ExclusiveUnion<{
  Include: DeploymentViewIncludePredicate<A>
  Exclude: DeploymentViewExcludePredicate<A>
  Style: DeploymentViewRuleStyle<A>
  AutoLayout: ViewRuleAutoLayout
  IncludeAncestors: ParsedViewRuleAncestors
  Group: DeploymentViewRuleGroup<A>
}>

export interface ParsedViewRuleAncestors {
  /**
   * When true, ancestor elements of included deployment nodes are also included in the view.
   * @default false (ancestors are not included)
   */
  includeAncestors: boolean
}

export interface ParsedDeploymentView<A extends AnyAux = Unknown> extends BaseParsedViewProperties<A> {
  [_type]: 'deployment'
  readonly rules: DeploymentViewRule<A>[]
}
