import { schemas } from '../schemas'
import { lines, property, zodOp } from './base'
import { deployment } from './deployment'
import { model } from './model'
import { specification } from './specification'
import { views } from './views'

export const likec4data = zodOp(schemas.likec4data)(
  lines(2)(
    property(
      'specification',
      specification.noparse(),
    ),
    model(),
    property(
      'deployment',
      deployment.noparse(),
    ),
    property(
      'deployments',
      deployment.noparse(),
    ),
    property(
      'views',
      views.noparse(),
    ),
  ),
)
