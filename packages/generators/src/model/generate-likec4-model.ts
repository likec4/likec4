import type { LikeC4Model } from '@likec4/core/model'
import JSON5 from 'json5'
import { CompositeGeneratorNode, toString } from 'langium/generate'
import { capitalize } from 'remeda'
import { generateAux } from './generate-aux'

export function generateLikeC4Model(model: LikeC4Model<any>) {
  const out = new CompositeGeneratorNode()
  const aux = generateAux(model)
  const ModelData = capitalize(model.stage) + 'LikeC4ModelData'

  out.appendTemplate`
    /* prettier-ignore-start */
    /* eslint-disable */

    /******************************************************************************
     * This file was generated
     * DO NOT EDIT MANUALLY!
     ******************************************************************************/

    import { LikeC4Model } from '@likec4/core/model'
    import type { ${ModelData} } from '@likec4/core/types'
    ${aux}

    export const likec4model: LikeC4Model<$Aux> = new LikeC4Model(<${ModelData}<$Aux>>(${
    JSON5.stringify(model.$data, { space: 2, quote: '\'' })
  } as unknown))

    /* prettier-ignore-end */
  `
  return toString(out)
}
