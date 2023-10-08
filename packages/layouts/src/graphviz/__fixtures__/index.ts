import { assignNavigateTo, computeView } from '@likec4/core'
import { amazonView, cloud3levels, cloudView, fakeModel, indexView } from './model'

const model = fakeModel()

export const [computedIndexView, computedCloudView, computedCloud3levels, computedAmazonView] =
  assignNavigateTo([
    computeView(indexView, model).view!,
    computeView(cloudView, model).view!,
    computeView(cloud3levels, model).view!,
    computeView(amazonView, model).view!
  ])
