import { LikeC4Model } from '@likec4/core'
import JSON5 from 'json5'

export function likec4ModelSources(model: LikeC4Model.Layouted) {
  return `
export const likec4ModelSource = ${JSON5.stringify(model.sourcemodel)}

`
}
