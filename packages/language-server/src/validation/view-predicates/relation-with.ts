import { AstUtils, type ValidationCheck } from 'langium'
import { ast } from '../../ast'
import type { LikeC4Services } from '../../module'

export const relationPredicateWithChecks = (
  _services: LikeC4Services
): ValidationCheck<ast.RelationPredicateWith> => {
  return (el, accept) => {
    const container = AstUtils.getContainerOfType(el, ast.isViewRulePredicate)
    if (ast.isExcludePredicate(container)) {
      accept('error', 'Invalid usage inside "exclude"', {
        node: el
      })
    }
  }
}
