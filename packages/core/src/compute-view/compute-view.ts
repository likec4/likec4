import { mapValues } from 'remeda'
import type { SetOptional } from 'type-fest'
import { nonexhaustive } from '../errors'
import { LikeC4Model } from '../model'
import {
  type ComputedLikeC4ModelFromParsed,
  type ComputedView,
  isDeploymentView,
  isDynamicView,
  isElementView,
  type LikeC4View,
  type ParsedLikeC4Model
} from '../types'
import { computeDeploymentView } from './deployment-view/compute'
import { DynamicViewComputeCtx } from './dynamic-view/compute'
import { computeElementView } from './element-view/computev2'
import { LikeC4ModelGraph } from './LikeC4ModelGraph'

type ComputeViewResult<V extends ComputedView = ComputedView> =
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

type ComputeViewFn = <V extends LikeC4View>(viewsource: V) => ComputeViewResult<ComputedView>

type Params = SetOptional<ParsedLikeC4Model, 'views'>
export function mkComputeView(model: Params): ComputeViewFn {
  const index = new LikeC4ModelGraph(model)
  let likec4model: LikeC4Model

  return function computeView(viewsource) {
    try {
      switch (true) {
        case isDeploymentView(viewsource): {
          likec4model ??= LikeC4Model.create({
            ...model,
            views: {}
          })
          return {
            isSuccess: true,
            view: computeDeploymentView(likec4model, viewsource)
          }
        }
        case isDynamicView(viewsource):
          return {
            isSuccess: true,
            view: DynamicViewComputeCtx.compute(viewsource, index)
          }
        case isElementView(viewsource):
          likec4model ??= LikeC4Model.create({
            ...model,
            views: {}
          })
          return {
            isSuccess: true,
            view: computeElementView(likec4model, viewsource)
          }

        default:
          nonexhaustive(viewsource)
      }
    } catch (e) {
      return {
        isSuccess: false,
        error: e instanceof Error ? e : new Error(`Unknown error: ${e}`),
        view: undefined
      }
    }
  }
}

export function computeViews<const P extends ParsedLikeC4Model<any, any, any, any, any, any>>(
  parsed: P
): ComputedLikeC4ModelFromParsed<P> {
  const _computeView = mkComputeView(parsed)
  const computeView = (source: LikeC4View): ComputedView => {
    const result = _computeView(source)
    if (result.isSuccess) {
      return result.view
    } else {
      throw result.error
    }
  }
  return {
    __: 'computed',
    ...parsed,
    views: mapValues(parsed.views, computeView)
  } as any // TODO: fix this
}
