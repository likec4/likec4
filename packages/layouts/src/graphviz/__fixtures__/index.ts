import { computeView, withReadableEdges } from '@likec4/core/compute-view'
import { LikeC4Model } from '@likec4/core/model'
import type { ComputedElementView, LikeC4View } from '@likec4/core/types'
import { omit } from 'remeda'
import { amazonView, cloud3levels, cloudView, FakeModel, indexView, issue577View } from './model'

export const parsedModel = LikeC4Model.fromDump(FakeModel)
export const computeElementView = (view: LikeC4View): ComputedElementView => {
  const result = computeView(view as any, parsedModel)
  if (!result.isSuccess) {
    throw result.error
  }
  return omit(withReadableEdges(result.view as ComputedElementView), ['nodeIds', 'edgeIds'])
}

export const [computedIndexView, computedCloudView, computedCloud3levels, computedAmazonView] = [
  computeElementView(indexView),
  computeElementView(cloudView),
  computeElementView(cloud3levels),
  computeElementView(amazonView),
]

export const issue577_fail = computeElementView(issue577View('https://icons/aws%20&%20CloudFront.svg'))
export const issue577_valid = computeElementView(issue577View('https://icons/aws%20%20CloudFront.svg'))
