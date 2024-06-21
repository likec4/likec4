import { computeElementView } from '@likec4/language-server/model-graph'
import { amazonView, cloud3levels, cloudView, fakeModel, indexView, issue577View } from './model'

const model = fakeModel()

export const [computedIndexView, computedCloudView, computedCloud3levels, computedAmazonView] = [
  computeElementView(indexView, model),
  computeElementView(cloudView, model),
  computeElementView(cloud3levels, model),
  computeElementView(amazonView, model)
]

export const issue577_fail = computeElementView(issue577View('https://icons/aws%20&%20CloudFront.svg'), model)
export const issue577_valid = computeElementView(issue577View('https://icons/aws%20%20CloudFront.svg'), model)
