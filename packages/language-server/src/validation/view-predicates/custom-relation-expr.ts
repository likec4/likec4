import type { ValidationCheck } from 'langium'
import { ast } from '../../ast'
import type { LikeC4Services } from '../../module'

export const customRelationExprChecks = (
  _services: LikeC4Services
): ValidationCheck<ast.CustomRelationExpr> => {
  return (el, accept) => {
    if (ast.isExcludePredicate(el.$container)) {
      accept('error', 'Invalid usage inside "exclude"', {
        node: el
      })
    }
  }
}
