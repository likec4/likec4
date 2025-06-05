import { nonexhaustive } from '@likec4/core'
import type { LikeC4Model } from '@likec4/core/model'
import JSON5 from 'json5'
import { CompositeGeneratorNode, toString } from 'langium/generate'
import { generateAux } from './generate-aux'

export function generateLikeC4Model(model: LikeC4Model<any>) {
  const out = new CompositeGeneratorNode()

  const aux = generateAux(model)

  let refined = ''
  switch (model.stage) {
    case 'parsed': {
      refined = '.Layouted'
      break
    }
    case 'computed': {
      refined = '.Computed'
      break
    }
    case 'layouted': {
      refined = '.Layouted'
      break
    }
    default:
      nonexhaustive(model.stage)
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

    export const likec4model: LikeC4Model<$Aux> = LikeC4Model.create(${
    JSON5.stringify(model.$data, { space: 2, quote: '\'' })
  } as any)

    /* prettier-ignore-end */
  `
  return toString(out)
}
