import type { AnyLikeC4Model } from '@likec4/core/model'
import JSON5 from 'json5'
import { CompositeGeneratorNode, toString } from 'langium/generate'
import { generateAux } from './generate-aux'

export function generateLikeC4Model(model: AnyLikeC4Model) {
  const out = new CompositeGeneratorNode()

  const aux = generateAux(model)

  let method = 'create', refined = ''
  switch (true) {
    case model.isFromParsed: {
      method = 'fromParsed'
      break
    }
    case model.isLayouted(): {
      refined = '.Layouted'
      break
    }
    case model.isComputed(): {
      refined = '.Computed'
      break
    }
    default:
      throw new Error('Invalid model type, expected parsed, computed or layouted')
  }

  out.appendTemplate`
    /* prettier-ignore-start */
    /* eslint-disable */

    /******************************************************************************
     * This file was generated
     * DO NOT EDIT MANUALLY!
     ******************************************************************************/

    import { LikeC4Model } from '@likec4/core/model'
    ${aux}

    export const likec4model: LikeC4Model${refined}<$Aux> = LikeC4Model.${method}(${
    JSON5.stringify(model.$model, { space: 2, quote: '\'' })
  } as any)

    /* prettier-ignore-end */
  `
  return toString(out)
}
