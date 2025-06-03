import type { MergeExclusive, Simplify } from 'type-fest'
import type { AnyAux, Unknown } from './aux'
import type { Expression, FqnExpr } from './expression'
import type {
  AnyExcludePredicate,
  AnyIncludePredicate,
  AnyViewRuleStyle,
  BaseParsedViewProperties,
  ViewRuleAutoLayout,
  ViewRuleGlobalStyle,
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

export type DeploymentViewPredicate<A extends AnyAux = Unknown> = Simplify<
  MergeExclusive<
    DeploymentViewIncludePredicate<A>,
    DeploymentViewExcludePredicate<A>
  >
>

export interface DeploymentViewRuleStyle<A extends AnyAux = Unknown> extends AnyViewRuleStyle<FqnExpr<A>> {}

export type DeploymentViewRule<A extends AnyAux = Unknown> =
  | DeploymentViewIncludePredicate<A>
  | DeploymentViewExcludePredicate<A>
  | DeploymentViewRuleStyle<A>
  | ViewRuleAutoLayout
  | ViewRuleGlobalStyle

export interface ParsedDeploymentView<A extends AnyAux = Unknown> extends BaseParsedViewProperties<A, 'deployment'> {
  readonly rules: DeploymentViewRule<A>[]
}
