import { type ComputedView, type DiagramView, type LikeC4Model, type ViewID } from '@likec4/core'
import { useContext } from 'react'
import { isDefined, isNonNullish, isString } from 'remeda'
import type { LiteralUnion } from 'type-fest'
import { LikeC4ModelContext } from './LikeC4ModelContext'

export function useLikeC4Model(): LikeC4Model | null
export function useLikeC4Model(strict: true): LikeC4Model
export function useLikeC4Model(strict: boolean): LikeC4Model | null
export function useLikeC4Model(strict: true, type: 'layouted'): LikeC4Model.Layouted
export function useLikeC4Model(strict: true, type: 'computed'): LikeC4Model.Computed
export function useLikeC4Model(strict: true, type: LikeC4Model['type'] | undefined): LikeC4Model
export function useLikeC4Model(strict: boolean, type: 'layouted'): LikeC4Model.Layouted | null
export function useLikeC4Model(strict: boolean, type: 'computed'): LikeC4Model.Computed | null
export function useLikeC4Model(strict: boolean, type: LikeC4Model['type'] | undefined): LikeC4Model | null
export function useLikeC4Model(strict?: boolean, type?: LikeC4Model['type']) {
  const model = useContext(LikeC4ModelContext)

  if (isString(type) && isNonNullish(model) && model.type !== type) {
    throw new Error(`Invalid LikeC4ModelContext, expected "${type}" but got "${model.type}" in context`)
  }

  if (isDefined(strict) && strict === true && !model) {
    throw new Error('No LikeC4Model found in context')
  }
  return model
}

export function useLikeC4Views(): LikeC4Model.SourceModel['views'] {
  return useLikeC4Model(true).sourcemodel.views
}

export function useLikeC4ViewModel(viewId: LiteralUnion<ViewID, string>): LikeC4Model.ViewModel {
  return useLikeC4Model(true).view(viewId)
}

/**
 * Parsed view, computed or layouted
 */
export function useLikeC4View(viewId: LiteralUnion<ViewID, string>): ComputedView | DiagramView | null {
  const model = useLikeC4Model(true)
  try {
    return model.view(viewId).view
  } catch (error) {
    console.warn(error)
    return null
  }
}

export function useLikeC4DiagramView(viewId: LiteralUnion<ViewID, string>): DiagramView | null {
  const model = useLikeC4Model(true, 'layouted')
  try {
    return model.view(viewId).view
  } catch (error) {
    console.warn(error)
    return null
  }
}
