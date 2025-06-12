import type { aux, LikeC4Model, LikeC4ViewModel } from '@likec4/core/model'
import { useContext } from 'react'
import { isString } from 'remeda'
import { LikeC4ModelContext } from './LikeC4ModelContext'

export function useLikeC4Model<A extends aux.Any = aux.Unknown>(): LikeC4Model<A>
export function useLikeC4Model<A extends aux.Any = aux.Unknown>(type: 'layouted'): LikeC4Model.Layouted<A>
export function useLikeC4Model<A extends aux.Any = aux.Unknown>(type: 'computed'): LikeC4Model.Computed<A>
// dprint-ignore
export function useLikeC4Model<A extends aux.Any = aux.Unknown>(type: 'layouted' | 'computed' | undefined): LikeC4Model<A>
export function useLikeC4Model(type?: 'layouted' | 'computed') {
  const model = useContext(LikeC4ModelContext)

  if (!model) {
    throw new Error('LikeC4Model not found. Make sure you have LikeC4ModelProvider.')
  }

  if (isString(type) && model.stage !== type) {
    throw new Error(`Invalid LikeC4ModelContext, expected "${type}" but got "${model.stage}" in context`)
  }

  return model
}

export function useLikeC4ViewModel<A extends aux.Any = aux.Unknown>(
  viewId: aux.LooseViewId<A>,
): LikeC4ViewModel<aux.toLayouted<A>> | null {
  const model = useLikeC4Model<A>('layouted')
  const view = model.findView(viewId)
  if (!view) {
    return null
  }
  if (!view.isDiagram()) {
    throw new Error(`View "${viewId}" is not layouted`)
  }
  return view as any
}

export function useLikeC4Specification() {
  const model = useLikeC4Model()
  return model.$data.specification
}
