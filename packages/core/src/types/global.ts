import type { NonEmptyTuple, Tagged } from 'type-fest'
import type { Any } from './_aux'
import type { NonEmptyArray } from './_common'
import type { DynamicViewIncludeRule } from './view-parsed.dynamic'
import type { ElementViewPredicate, ElementViewRuleStyle } from './view-parsed.element'

export type GlobalPredicateId = Tagged<string, 'GlobalPredicateId'>

export type GlobalPredicates<A extends Any = Any> = NonEmptyArray<ElementViewPredicate<A>>

export type GlobalDynamicPredicates<A extends Any = Any> = NonEmptyArray<DynamicViewIncludeRule<A>>

export type GlobalStyleID = Tagged<string, 'GlobalStyleID'>

export type GlobalStyles<A extends Any = Any> = NonEmptyTuple<ElementViewRuleStyle<A>>

export interface ModelGlobals<A extends Any = Any> {
  readonly predicates: Record<GlobalPredicateId, GlobalPredicates<A>>
  readonly dynamicPredicates: Record<GlobalPredicateId, GlobalDynamicPredicates<A>>
  readonly styles: Record<GlobalStyleID, GlobalStyles<A>>
}
