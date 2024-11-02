import type { NonEmptyTuple, Tagged } from 'type-fest'
import type { NonEmptyArray } from './_common'
import type { DynamicViewIncludeRule, ViewRulePredicate, ViewRuleStyle } from './view'

export type GlobalPredicateId = Tagged<string, 'GlobalPredicateId'>

export type GlobalPredicates = NonEmptyArray<ViewRulePredicate>

export type GlobalDynamicPredicates = NonEmptyArray<DynamicViewIncludeRule>

export type GlobalStyleID = Tagged<string, 'GlobalStyleID'>

export type GlobalStyles = NonEmptyTuple<ViewRuleStyle>

export interface ModelGlobals {
  predicates: Record<GlobalPredicateId, GlobalPredicates>
  dynamicPredicates: Record<GlobalPredicateId, GlobalDynamicPredicates>
  styles: Record<GlobalStyleID, GlobalStyles>
}
