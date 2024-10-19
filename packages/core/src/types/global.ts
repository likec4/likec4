import type { Tagged } from 'type-fest'
import type { NonEmptyArray } from './_common'
import type { ViewRuleStyle } from './view'

export type GlobalStyleID = Tagged<string, 'GlobalStyleID'>

export interface GlobalStyle {
  readonly id: GlobalStyleID
  readonly styles: NonEmptyArray<ViewRuleStyle>
}
