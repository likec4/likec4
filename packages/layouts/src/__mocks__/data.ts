import { computeView, assignNavigateTo } from '@likec4/core'
import { cloudView, cloud3levels, amazonView, fakeModel, indexView } from './model'

const model = fakeModel()

export const [
  computedIndexView,
  computedCloudView,
  computedCloud3levels,
  computedAmazonView
] = assignNavigateTo([
  computeView(indexView, model)!,
  computeView(cloudView, model)!,
  computeView(cloud3levels, model)!,
  computeView(amazonView, model)!
])
