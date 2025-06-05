import type { MergeExclusive, Simplify } from 'type-fest'
import type { ExclusiveUnion } from './_common'
import type { AnyAux, Unknown } from './aux'
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
export interface DeploymentViewIncludePredicate<A extends AnyAux = Unknown>
  extends AnyIncludePredicate<Expression<A>>
{}
export interface DeploymentViewExcludePredicate<A extends AnyAux = Unknown>
  extends AnyExcludePredicate<Expression<A>>
{}

export type DeploymentViewPredicate<A extends AnyAux = Unknown> =
  | DeploymentViewIncludePredicate<A>
  | DeploymentViewExcludePredicate<A>

export interface DeploymentViewRuleStyle<A extends AnyAux = Unknown> extends AnyViewRuleStyle<FqnExpr<A>> {}

export type DeploymentViewRule<A extends AnyAux = Unknown> = ExclusiveUnion<{
  Include: DeploymentViewIncludePredicate<A>
  Exclude: DeploymentViewExcludePredicate<A>
  Style: DeploymentViewRuleStyle<A>
  AutoLayout: ViewRuleAutoLayout
}>

export interface ParsedDeploymentView<A extends AnyAux = Unknown> extends BaseParsedViewProperties<A> {
  [_type]: 'deployment'
  readonly rules: DeploymentViewRule<A>[]
}
