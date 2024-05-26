import { type BaseError, type ComputedView, type ElementView, normalizeError } from '@likec4/core'
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
    error: Error
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
      error: e instanceof Error ? e : new Error(`Unknown error: ${e}`),
      view: undefined
    }
  }
}
