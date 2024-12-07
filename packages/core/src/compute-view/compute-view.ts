import { mapValues } from 'remeda'
import type { SetOptional } from 'type-fest'
import { nonexhaustive } from '../errors'
import { LikeC4Model } from '../model'
import {
  type ComputedDeploymentView,
  type ComputedDynamicView,
  type ComputedElementView,
  type ComputedLikeC4ModelFromParsed,
  type ComputedView,
  type DeploymentView,
  type DynamicView,
  type ElementView,
  isDeploymentView,
  isDynamicView,
  isElementView,
  type LikeC4View,
  type ParsedLikeC4Model
} from '../types'
import { computeDeploymentView } from './deployment-view/compute'
import { DynamicViewComputeCtx } from './dynamic-view/compute'
import { ComputeCtx } from './element-view/compute'
import { LikeC4ModelGraph } from './LikeC4ModelGraph'

type ComputeViewResult<V extends ComputedView = ComputedView> =
  | {
    isSuccess: true
    view: V
  }
  | {
    isSuccess: false
    error: Error
    view: undefined
  }

interface ComputeView {
  (viewsource: DeploymentView): ComputeViewResult<ComputedDeploymentView>
  (viewsource: DynamicView): ComputeViewResult<ComputedDynamicView>
  (viewsource: ElementView): ComputeViewResult<ComputedElementView>
  (viewsource: LikeC4View): ComputeViewResult<ComputedView>
}

type Params = SetOptional<ParsedLikeC4Model, 'views'>
export function mkComputeView(model: Params): ComputeView {
  const index = new LikeC4ModelGraph(model)
  let likec4model: LikeC4Model

  return function computeView(viewsource) {
    try {
      let view
      switch (true) {
        case isElementView(viewsource):
          view = ComputeCtx.elementView(viewsource, index)
          break
        case isDeploymentView(viewsource): {
          likec4model ??= LikeC4Model.create({
            ...model,
            views: {}
          })
          view = computeDeploymentView(likec4model, viewsource)
          break
        }
        case isDynamicView(viewsource):
          view = DynamicViewComputeCtx.compute(viewsource, index)
          break
        default:
          nonexhaustive(viewsource)
      }
      return {
        isSuccess: true,
        view: view as any
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

export function computeViews<const M extends ParsedLikeC4Model>(
  { views, ...model }: M
): ComputedLikeC4ModelFromParsed<M> {
  const _computeView = mkComputeView(model)
  const computeView = (source: LikeC4View): ComputedView => {
    const result = _computeView(source)
    if (result.isSuccess) {
      return result.view
    } else {
      throw result.error
    }
  }
  return {
    ...model,
    __: 'computed',
    views: mapValues(views, computeView)
  } as any // TODO: fix this
}
