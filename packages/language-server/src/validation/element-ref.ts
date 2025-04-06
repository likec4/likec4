import { type ValidationCheck } from 'langium'
import type { ast } from '../ast'
import type { LikeC4Services } from '../module'
import { isReferenceToDeploymentModel } from '../utils'
import { tryOrLog } from './_shared'


export const checkElementRef = (services: LikeC4Services): ValidationCheck<ast.ElementRef> => {
  return tryOrLog((el, accept) => {
    if (isReferenceToDeploymentModel(el.element)) {
      accept('error', 'Deployment model elements cannot be referenced', {
        node: el,
      })
    }
  })
}
