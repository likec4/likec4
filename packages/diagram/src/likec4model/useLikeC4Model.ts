import {
  type ComputedView,
  type DiagramView,
  invariant,
  type LayoutedLikeC4Model,
  LikeC4Model,
  type ViewID
} from '@likec4/core'
import { useContext } from 'react'
import { isDefined, isNonNullish, isString } from 'remeda'
import type { LiteralUnion } from 'type-fest'
import { type DiagramState, useDiagramState } from '../hooks'
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

export function useLikeC4Views(): LikeC4Model.Sources['views'] {
  return useLikeC4Model(true).$model.views
}

export function useLikeC4ViewModel(viewId: LiteralUnion<ViewID, string>): LikeC4Model.View {
  return useLikeC4Model(true).view(viewId)
}

const selectViewId = (state: DiagramState) => state.view.id
export function useLikeC4CurrentViewModel(): LikeC4Model.View {
  const viewId = useDiagramState(selectViewId)
  return useLikeC4Model(true).view(viewId)
}

/**
 * Parsed view, computed or layouted
 */
export function useLikeC4View(viewId: LiteralUnion<ViewID, string>): ComputedView | DiagramView | null {
  const model = useLikeC4Model(true)
  try {
    return model.view(viewId).$view
  } catch (error) {
    console.warn(error)
    return null
  }
}

export function useLikeC4DiagramView(viewId: LiteralUnion<ViewID, string>): DiagramView | null {
  const model = useLikeC4Model(true, 'layouted')
  try {
    return model.view(viewId).$view
  } catch (error) {
    console.warn(error)
    return null
  }
}
