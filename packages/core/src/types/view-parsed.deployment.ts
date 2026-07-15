import type { AnyAux } from './_aux'
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

/**
 * Predicates scoped to deployment model
 */
export interface DeploymentViewIncludePredicate<A extends AnyAux = AnyAux> extends AnyIncludePredicate<Expression<A>>
{}
export interface DeploymentViewExcludePredicate<A extends AnyAux = AnyAux> extends AnyExcludePredicate<Expression<A>>
{}

export type DeploymentViewPredicate<A extends AnyAux = AnyAux> =
  | DeploymentViewIncludePredicate<A>
  | DeploymentViewExcludePredicate<A>

export interface DeploymentViewRuleStyle<A extends AnyAux = AnyAux> extends AnyViewRuleStyle<FqnExpr<A>> {}

export type DeploymentViewRule<A extends AnyAux = AnyAux> = ExclusiveUnion<{
  Include: DeploymentViewIncludePredicate<A>
  Exclude: DeploymentViewExcludePredicate<A>
  Style: DeploymentViewRuleStyle<A>
  AutoLayout: ViewRuleAutoLayout
  IncludeAncestors: ParsedViewRuleAncestors
}>

export interface ParsedViewRuleAncestors {
  /**
   * When true, ancestor elements of included deployment nodes are also included in the view.
   * @default false (ancestors are not included)
   */
  includeAncestors: boolean
}

export interface ParsedDeploymentView<A extends AnyAux = AnyAux> extends BaseParsedViewProperties<A> {
  [_type]: 'deployment'
  readonly rules: DeploymentViewRule<A>[]
}
