import * as z from 'zod/v4'
import { schemas } from '../schemas'
import { lines, property, zodOp } from './base'
import { deployment } from './deployment'
import { model } from './model'
import { specification } from './specification'
import { views } from './views'

const likec4dataSchema = z.object({
  // ...schemas.likec4data.shape,
})

export const likec4data = zodOp(schemas.likec4data)(
  lines(2)(
    property(
      'specification',
      specification(),
    ),
    model(),
    property(
      'deployment',
      deployment(),
    ),
    property(
      'deployments',
      deployment(),
    ),
    property(
      'views',
      views(),
    ),
  ),
)
