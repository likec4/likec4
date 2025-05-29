import type { AnyLikeC4Model } from '@likec4/core/model'
import JSON5 from 'json5'
import { CompositeGeneratorNode, toString } from 'langium/generate'
import { generateAux } from './generate-aux'

export function generateLikeC4Model(model: AnyLikeC4Model) {
  const out = new CompositeGeneratorNode()

  const aux = generateAux(model)

  const method = model.isFromParsed ? 'fromParsed' : 'create'

  out.appendTemplate`
    // @ts-nocheck
    /* prettier-ignore-start */
    /* eslint-disable */

    /******************************************************************************
     * This file was generated
     * DO NOT EDIT MANUALLY!
     ******************************************************************************/

    import { LikeC4Model } from '@likec4/core/model'
    ${aux}

    export const likeC4Model = LikeC4Model.${method}<$Aux>(${
    JSON5.stringify(model.$model, {
      space: 2,
      quote: '\'',
    })
  } as any)

    /* prettier-ignore-end */
  `
  return toString(out)
}
