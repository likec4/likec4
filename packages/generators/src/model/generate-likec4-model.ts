import { LikeC4Model } from '@likec4/core/model'
import JSON5 from 'json5'
import { CompositeGeneratorNode, NL, toString } from 'langium/generate'
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
  `
    .append(NL, aux, NL, NL)
    .append(`export const likec4model: LikeC4Model<$Aux> = new LikeC4Model(<${ModelData}<$Aux>>(`)
    .append(JSON5.stringify(model.$data, { space: 2, quote: '\'' }))
    .append(' as unknown))', NL, NL)
    .append('/* prettier-ignore-end */', NL)
  return toString(out)
}
