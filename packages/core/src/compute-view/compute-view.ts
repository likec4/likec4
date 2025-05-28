import { indexBy, values } from 'remeda'
import { nonexhaustive } from '../errors'
import { LikeC4Model } from '../model'
import {
  type AnyAux,
  type ComputedDeploymentView,
  type ComputedDynamicView,
  type ComputedElementView,
  type ComputedLikeC4ModelData,
  type ComputedView,
  type DeploymentView,
  type DynamicView,
  type ElementView,
  type LikeC4View,
  type ParsedLikeC4ModelData,
  isDeploymentView,
  isDynamicView,
  isElementView,
} from '../types'
import { computeDeploymentView } from './deployment-view/compute'
import { computeDynamicView } from './dynamic-view/compute'
import { computeElementView } from './element-view/compute'

export type ComputeViewResult<V> =
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

// dprint-ignore
export function unsafeComputeView<A extends AnyAux>(viewsource: ElementView<NoInfer<A>>, likec4model: LikeC4Model<A>): ComputedElementView<A>
// dprint-ignore
export function unsafeComputeView<A extends AnyAux>(viewsource: DeploymentView<NoInfer<A>>, likec4model: LikeC4Model<A>): ComputedDeploymentView<A>
// dprint-ignore
export function unsafeComputeView<A extends AnyAux>(viewsource: DynamicView<NoInfer<A>>, likec4model: LikeC4Model<A>): ComputedDynamicView<A>
// dprint-ignore
export function unsafeComputeView<A extends AnyAux>(viewsource: LikeC4View<NoInfer<A>>, likec4model: LikeC4Model<A>): ComputedView<A>
export function unsafeComputeView<A extends AnyAux>(
  viewsource: LikeC4View<NoInfer<A>>,
  likec4model: LikeC4Model<A>,
) {
  switch (true) {
    case isElementView(viewsource):
      return computeElementView(likec4model, viewsource)
    case isDeploymentView(viewsource):
      return computeDeploymentView(likec4model, viewsource)
    case isDynamicView(viewsource):
      return computeDynamicView(likec4model, viewsource)
    default:
      nonexhaustive(viewsource)
  }
}

// dprint-ignore
export function computeView<A extends AnyAux>(viewsource: ElementView<NoInfer<A>>, likec4model: LikeC4Model<A>): ComputeViewResult<ComputedElementView<A>>
// dprint-ignore
export function computeView<A extends AnyAux>(viewsource: DeploymentView<NoInfer<A>>, likec4model: LikeC4Model<A>): ComputeViewResult<ComputedDeploymentView<A>>
// dprint-ignore
export function computeView<A extends AnyAux>(viewsource: DynamicView<NoInfer<A>>, likec4model: LikeC4Model<A>): ComputeViewResult<ComputedDynamicView<A>>
// dprint-ignore
export function computeView<A extends AnyAux>(viewsource: LikeC4View<NoInfer<A>>, likec4model: LikeC4Model<A>): ComputeViewResult<ComputedView<A>> {
  try {
    return {
      isSuccess: true,
      view: unsafeComputeView(viewsource, likec4model),
    }
  } catch (e) {
    return {
      isSuccess: false,
      error: e instanceof Error ? e : new Error(`Unknown error: ${e}`),
      view: undefined,
    }
  }
}

export function computeViews<A extends AnyAux>(parsed: ParsedLikeC4ModelData<A>): ComputedLikeC4ModelData<A> {
  const likec4model = LikeC4Model.fromParsed(parsed)
  const views = values(parsed.views as Record<string, LikeC4View<A>>).map(v => unsafeComputeView(v, likec4model))
  return {
    ...parsed,
    __: 'computed',
    views: indexBy(views, v => v.id) as ComputedLikeC4ModelData<A>['views'],
  }
}

export function computeLikeC4Model<A extends AnyAux>(parsed: ParsedLikeC4ModelData<A>): LikeC4Model<A> {
  return LikeC4Model.create(computeViews(parsed))
}
