import type { NonEmptyTuple, Tagged } from 'type-fest'
import type { NonEmptyArray } from './_common'
import type { ViewRulePredicate } from './view'
import type { AnyViewRuleStyle } from './view-common'
import type { DynamicViewIncludeRule } from './view-parsed.dynamic'

export type GlobalPredicateId = Tagged<string, 'GlobalPredicateId'>

export type GlobalPredicates = NonEmptyArray<ViewRulePredicate<any>>

export type GlobalDynamicPredicates = NonEmptyArray<DynamicViewIncludeRule<any>>

export type GlobalStyleID = Tagged<string, 'GlobalStyleID'>

export type GlobalStyles = NonEmptyTuple<AnyViewRuleStyle<any>>

export interface ModelGlobals {
  readonly predicates: Record<GlobalPredicateId, GlobalPredicates>
  readonly dynamicPredicates: Record<GlobalPredicateId, GlobalDynamicPredicates>
  readonly styles: Record<GlobalStyleID, GlobalStyles>
}
