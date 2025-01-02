import { type ValidationCheck, AstUtils } from 'langium'
import { ast } from '../../ast'
import type { LikeC4Services } from '../../module'
import { tryOrLog } from '../_shared'

export const relationPredicateWithChecks = (
  _services: LikeC4Services,
): ValidationCheck<ast.RelationPredicateWith> => {
  return tryOrLog((el, accept) => {
    const container = AstUtils.getContainerOfType(el, ast.isViewRulePredicate)
    if (ast.isExcludePredicate(container)) {
      accept('error', 'Invalid usage inside "exclude"', {
        node: el,
      })
    }
  })
}
