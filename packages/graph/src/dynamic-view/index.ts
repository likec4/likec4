import { type ComputedDynamicView, type DynamicView } from '@likec4/core'
import type { LikeC4ModelGraph } from '../LikeC4ModelGraph'
import { DynamicViewComputeCtx } from './compute'

type ComputeViewResult =
  | {
    isSuccess: true
    view: ComputedDynamicView
  }
  | {
    isSuccess: false
    error: Error
    view: undefined
  }

export function computeDynamicView(view: DynamicView, graph: LikeC4ModelGraph): ComputeViewResult {
  try {
    return {
      isSuccess: true,
      view: DynamicViewComputeCtx.compute(view, graph)
    }
  } catch (e) {
    return {
      isSuccess: false,
      error: e instanceof Error ? e : new Error(`Unknown error: ${e}`),
      view: undefined
    }
  }
}
