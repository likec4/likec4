import { computeView } from '@likec4/graph'
import { amazonView, cloud3levels, cloudView, fakeModel, indexView } from './model'

const model = fakeModel()

export const [computedIndexView, computedCloudView, computedCloud3levels, computedAmazonView] = [
  computeView(indexView, model).view!,
  computeView(cloudView, model).view!,
  computeView(cloud3levels, model).view!,
  computeView(amazonView, model).view!
]
