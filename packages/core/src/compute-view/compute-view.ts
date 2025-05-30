import { indexBy, values } from 'remeda'
import { nonexhaustive } from '../errors'
import { LikeC4Model } from '../model'
import {
  type AnyAux,
  type ComputedLikeC4ModelData,
  type ComputedView,
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

export function unsafeComputeView<A extends AnyAux>(
  viewsource: LikeC4View<NoInfer<A>>,
  likec4model: LikeC4Model<A>,
): ComputedView<A> {
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

export function computeView<A extends AnyAux>(
  viewsource: LikeC4View<A>,
  likec4model: LikeC4Model<A>,
): ComputeViewResult<ComputedView<A>> {
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
  const views = values(parsed.views as Record<string, LikeC4View<typeof likec4model.Aux>>).map(v =>
    unsafeComputeView(v, likec4model)
  )
  return {
    __: 'computed',
    ...parsed,
    views: indexBy(views, v => v.id),
  } as unknown as ComputedLikeC4ModelData<A>
}

export function computeLikeC4Model<A extends AnyAux>(parsed: ParsedLikeC4ModelData<A>): LikeC4Model.Computed<A> {
  return LikeC4Model.create(computeViews(parsed))
}
