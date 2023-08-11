import { assignNavigateTo, computeView } from '@likec4/core/compute-view'
import { amazonView, cloud3levels, cloudView, fakeModel, indexView } from './model'

const model = fakeModel()

export const [computedIndexView, computedCloudView, computedCloud3levels, computedAmazonView] =
  assignNavigateTo([
    computeView(indexView, model)!,
    computeView(cloudView, model)!,
    computeView(cloud3levels, model)!,
    computeView(amazonView, model)!
  ])
