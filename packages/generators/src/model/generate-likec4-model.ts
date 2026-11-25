import type { LikeC4Model } from '@likec4/core/model'
import JSON5 from 'json5'
import { generateAux } from './generate-aux'

export function generateLikeC4Model(model: LikeC4Model<any>, options: { useCorePackage?: boolean } = {}) {
  const aux = generateAux(model, options)
  const { useCorePackage = false } = options
  const rootImport = useCorePackage ? '@likec4' : 'likec4'
  return `
/* prettier-ignore-start */
/* eslint-disable */

/******************************************************************************
 * This file was generated
 * DO NOT EDIT MANUALLY!
 ******************************************************************************/

import { LikeC4Model } from '${rootImport}/core/model'
${aux}

export const likec4model: LikeC4Model<$Aux> = new LikeC4Model(${
    JSON5.stringify(model.$data, { space: 2, quote: '\'' })
  } as any) as any

/* prettier-ignore-end */
`.trimStart()
}
