import type { LikeC4Model } from '@likec4/core'
import { useContext } from 'react'
import { isDefined, isNonNullish, isString } from 'remeda'
import { LikeC4ModelContext } from './LikeC4ModelContext'

export function useLikeC4Model(): LikeC4Model | null
export function useLikeC4Model(strict: true): LikeC4Model
export function useLikeC4Model(strict: boolean): LikeC4Model | null
export function useLikeC4Model(strict: true, type: 'layouted'): LikeC4Model.Layouted
export function useLikeC4Model(strict: true, type: 'computed'): LikeC4Model.Computed
export function useLikeC4Model(strict: true, type: 'layouted' | 'computed' | undefined): LikeC4Model
export function useLikeC4Model(strict: boolean, type: 'layouted'): LikeC4Model.Layouted | null
export function useLikeC4Model(strict: boolean, type: 'computed'): LikeC4Model.Computed | null
export function useLikeC4Model(strict: boolean, type: 'layouted' | 'computed' | undefined): LikeC4Model | null
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
