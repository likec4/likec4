import { mapValues } from 'remeda'
import { nonexhaustive } from '../errors'
import { LikeC4Model } from '../model'
import {
  type ComputedLikeC4Model,
  type ComputedView,
  isDeploymentView,
  isDynamicView,
  isElementView,
  type LikeC4View,
  type ParsedLikeC4Model
} from '../types'
import { computeDeploymentView } from './deployment-view/compute'
import { computeDynamicView } from './dynamic-view/compute'
import { computeElementView } from './element-view/compute'

export type ComputeViewResult<V extends ComputedView = ComputedView> =
  | {
    isSuccess: true
    error?: undefined
    view: V
  }
  | {
    isSuccess: false
    error: Error
    view: undefined
  }

export function unsafeComputeView(
  viewsource: LikeC4View,
  likec4model: LikeC4Model
): ComputedView {
  switch (true) {
    case isDeploymentView(viewsource): {
      return computeDeploymentView(likec4model, viewsource)
    }
    case isDynamicView(viewsource):
      return computeDynamicView(likec4model, viewsource)
    case isElementView(viewsource):
      return computeElementView(likec4model, viewsource)
    default:
      nonexhaustive(viewsource)
  }
}

export function computeView<V extends LikeC4View>(
  viewsource: V,
  likec4model: LikeC4Model
): ComputeViewResult {
  try {
    return {
      isSuccess: true,
      view: unsafeComputeView(viewsource, likec4model)
    }
  } catch (e) {
    return {
      isSuccess: false,
      error: e instanceof Error ? e : new Error(`Unknown error: ${e}`),
      view: undefined
    }
  }
}

export function computeViews<P extends ParsedLikeC4Model>(parsed: P): ComputedLikeC4Model {
  const { views, ...rest } = parsed as Omit<P, '__'>
  const likec4model = LikeC4Model.create({
    ...rest,
    views: {}
  })
  const compute = (source: LikeC4View): ComputedView => {
    const result = computeView(source, likec4model)
    if (result.isSuccess) {
      return result.view
    } else {
      throw result.error
    }
  }
  return {
    ...rest,
    __: 'computed',
    views: mapValues(parsed.views, compute)
  }
}
