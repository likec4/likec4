import { AstUtils, type ValidationCheck } from 'langium'
import { isNullish } from 'remeda'
import { ast } from '../../ast'
import type { LikeC4Services } from '../../module'

export const outgoingExpressionChecks = (
  _services: LikeC4Services
): ValidationCheck<ast.OutgoingRelationExpression> => {
  return (el, accept) => {
    if (ast.isWildcardExpression(el.from) && ast.isExpressions(el.$container)) {
      const view = AstUtils.getContainerOfType(el, ast.isElementView)
      if (isNullish(view?.viewOf)) {
        accept('warning', 'Predicate is ignored as it concerns all relationships', {
          node: el
        })
      }
    }
  }
}
