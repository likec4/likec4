import { mapValues } from 'remeda'
import { LikeC4Model } from '../model'
import {
  type AnyAux,
  type aux,
  type ComputedLikeC4ModelData,
  type ComputedView,
  type ParsedLikeC4ModelData,
  type ParsedView,
  _stage,
  isDeploymentView,
  isDynamicView,
  isElementView,
} from '../types'
import type { Any, AnyParsed, ViewId } from '../types/_aux'
import { nonexhaustive } from '../utils'
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

export function unsafeComputeView<A extends Any>(
  viewsource: ParsedView<A>,
  likec4model: LikeC4Model<any>,
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

export function computeView<A extends Any>(
  viewsource: ParsedView<A>,
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

export function computeParsedModelData<A extends AnyParsed, B extends aux.toComputed<A> = aux.toComputed<A>>(
  parsed: ParsedLikeC4ModelData<A>,
): ComputedLikeC4ModelData<B> {
  const likec4model = LikeC4Model.create(parsed)
  let {
    views: _views,
    _stage: __omitted,
    ...rest
  } = parsed as unknown as ComputedLikeC4ModelData<B>

  const views = mapValues(_views as unknown as Record<string, ParsedView<B>>, v => unsafeComputeView(v, likec4model))

  return {
    ...rest,
    [_stage]: 'computed',
    views: views as unknown as Record<ViewId<B>, ComputedView<B>>,
  }
}

export function computeLikeC4Model<A extends AnyAux, B extends aux.toComputed<A> = aux.toComputed<A>>(
  parsed: ParsedLikeC4ModelData<A>,
): LikeC4Model<B> {
  return LikeC4Model.create(computeParsedModelData<A, B>(parsed))
}
