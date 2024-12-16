import type { NonEmptyTuple, Tagged } from 'type-fest'
import type { NonEmptyArray } from './_common'
import type { DynamicViewIncludeRule, ViewRulePredicate, ViewRuleStyle } from './view'

export type GlobalPredicateId = Tagged<string, 'GlobalPredicateId'>

export type GlobalPredicates = NonEmptyArray<ViewRulePredicate>

export type GlobalDynamicPredicates = NonEmptyArray<DynamicViewIncludeRule>

export type GlobalStyleID = Tagged<string, 'GlobalStyleID'>

export type GlobalStyles = NonEmptyTuple<ViewRuleStyle>

export interface ModelGlobals {
  readonly predicates: Readonly<Record<GlobalPredicateId, GlobalPredicates>>
  readonly dynamicPredicates: Readonly<Record<GlobalPredicateId, GlobalDynamicPredicates>>
  readonly styles: Readonly<Record<GlobalStyleID, GlobalStyles>>
}
