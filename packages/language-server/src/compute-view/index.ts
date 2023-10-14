import type { BaseError } from '@likec4/core'
import { normalizeError, type ElementView, type ComputedView } from '@likec4/core'
import type { LikeC4ModelGraph } from '../LikeC4ModelGraph'
import { ComputeCtx } from './compute'

export function computeElementView(view: ElementView, graph: LikeC4ModelGraph) {
  return ComputeCtx.elementView(view, graph)
}

type ComputeViewResult =
  | {
      isSuccess: true
      view: ComputedView
    }
  | {
      isSuccess: false
      error: BaseError
      view: undefined
    }

export function computeView(view: ElementView, graph: LikeC4ModelGraph): ComputeViewResult {
  try {
    return {
      isSuccess: true,
      view: computeElementView(view, graph)
    }
  } catch (e) {
    return {
      isSuccess: false,
      error: normalizeError(e),
      view: undefined
    }
  }
}

export * from './assignNavigateTo'
export * from './resolve-extended-views'
export * from './resolve-relative-paths'
