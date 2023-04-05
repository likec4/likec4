import { computeView } from '@likec4/core/compute-view'
import { cloudView, cloud3levels, amazonView, fakeModel, indexView } from './model'

const model = fakeModel()

export const computedIndexView = computeView(indexView, model)
export const computedCloudView = computeView(cloudView, model)
export const computedCloud3levels = computeView(cloud3levels, model)
export const computedAmazonView = computeView(amazonView, model)
