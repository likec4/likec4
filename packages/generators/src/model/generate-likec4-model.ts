import { type LikeC4Model } from '@likec4/core'
import JSON5 from 'json5'
import { CompositeGeneratorNode, toString } from 'langium/generate'

export function generateLikeC4Model(model: LikeC4Model) {
  const out = new CompositeGeneratorNode()
  out.appendTemplate`
    /* prettier-ignore-start */
    /* eslint-disable */
    /******************************************************************************
     * This file was generated
     * DO NOT EDIT MANUALLY!
     ******************************************************************************/
    import { LikeC4Model } from 'likec4'

    export const likeC4Model = LikeC4Model.fromDump(${
    JSON5.stringify(model.$model, {
      space: 2,
      quote: '\''
    })
  })

    export type LikeC4ElementId = typeof likeC4Model.Aux.Fqn
    export type LikeC4ViewId = typeof likeC4Model.Aux.ViewId
  `
  return toString(out)
}
