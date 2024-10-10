import type { ComputedElementView, ElementView, ViewRule } from '@likec4/core'
import type { LikeC4ModelGraph } from '../LikeC4ModelGraph'
import { ComputeCtx } from './compute'

export function computeElementView(view: ElementView, graph: LikeC4ModelGraph, global_rules?: ViewRule[]) {
  return ComputeCtx.elementView(view, graph, global_rules)
}

type ComputeViewResult =
  | {
    isSuccess: true
    view: ComputedElementView
  }
  | {
    isSuccess: false
    error: Error
    view: undefined
  }

export function computeView(view: ElementView, graph: LikeC4ModelGraph, global_rules?: ViewRule[]): ComputeViewResult {
  try {
    return {
      isSuccess: true,
      view: computeElementView(view, graph, global_rules)
    }
  } catch (e) {
    return {
      isSuccess: false,
      error: e instanceof Error ? e : new Error(`Unknown error: ${e}`),
      view: undefined
    }
  }
}
