import type { Tagged } from 'type-fest'
import type { NonEmptyArray } from './_common'
import type { DynamicViewIncludeRule, ViewRulePredicate, ViewRuleStyle } from './view'

export type GlobalElRelID = Tagged<string, 'GlobalElRelID'>

export interface GlobalElRel {
  readonly id: GlobalElRelID
  readonly predicates: NonEmptyArray<ViewRulePredicate>
}

export interface GlobalDynamicElRel {
  readonly id: GlobalElRelID
  readonly dynamicPredicates: NonEmptyArray<DynamicViewIncludeRule>
}

export type GlobalStyleID = Tagged<string, 'GlobalStyleID'>

export interface GlobalStyle {
  readonly id: GlobalStyleID
  readonly styles: NonEmptyArray<ViewRuleStyle>
}
