import type { AnyAux, LikeC4Model, Unknown } from '@likec4/core/model'
import { useContext } from 'react'
import { isDefined, isNonNullish, isString } from 'remeda'
import { LikeC4ModelContext } from './LikeC4ModelContext'

export function useLikeC4Model<A extends AnyAux = Unknown>(): LikeC4Model<A> | null
export function useLikeC4Model<A extends AnyAux = Unknown>(strict: true): LikeC4Model<A>
export function useLikeC4Model<A extends AnyAux = Unknown>(strict: boolean): LikeC4Model<A> | null
export function useLikeC4Model<A extends AnyAux = Unknown>(strict: true, type: 'layouted'): LikeC4Model.Layouted<A>
export function useLikeC4Model<A extends AnyAux = Unknown>(strict: true, type: 'computed'): LikeC4Model.Computed<A>
// dprint-ignore
export function useLikeC4Model<A extends AnyAux = Unknown>(strict: true, type: 'layouted' | 'computed' | undefined): LikeC4Model<A>
// dprint-ignore
export function useLikeC4Model<A extends AnyAux = Unknown>(strict: boolean, type: 'layouted'): LikeC4Model.Layouted<A> | null
// dprint-ignore
export function useLikeC4Model<A extends AnyAux = Unknown>(strict: boolean, type: 'computed'): LikeC4Model.Computed<A> | null
// dprint-ignore
export function useLikeC4Model<A extends AnyAux = Unknown>(strict: boolean, type: 'layouted' | 'computed' | undefined): LikeC4Model<A> | null
export function useLikeC4Model(strict?: boolean, type?: 'layouted' | 'computed') {
  const model = useContext(LikeC4ModelContext)

  if (isString(type) && isNonNullish(model) && model.type !== type) {
    throw new Error(`Invalid LikeC4ModelContext, expected "${type}" but got "${model.type}" in context`)
  }

  if (isDefined(strict) && strict === true && !model) {
    throw new Error('No LikeC4Model found in context')
  }
  return model
}
