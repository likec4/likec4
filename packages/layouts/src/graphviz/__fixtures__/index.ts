import { computeElementView } from '@likec4/graph'
import { amazonView, cloud3levels, cloudView, fakeModel, indexView } from './model'

const model = fakeModel()

export const [computedIndexView, computedCloudView, computedCloud3levels, computedAmazonView] = [
  computeElementView(indexView, model),
  computeElementView(cloudView, model),
  computeElementView(cloud3levels, model),
  computeElementView(amazonView, model)
]
