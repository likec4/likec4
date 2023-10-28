import type { ValidationCheck } from 'langium'
import { ast } from '../../ast'
import type { LikeC4Services } from '../../module'
import { isNil } from 'remeda'

export const outgoingExpressionChecks = (
  _services: LikeC4Services
): ValidationCheck<ast.OutgoingExpression> => {
  return (el, accept) => {
    if (ast.isWildcardExpression(el.source) && ast.isViewRuleExpression(el.$container)) {
      const view = el.$container.$container.$container
      if (isNil(view.viewOf)) {
        accept('warning', 'Predicate is ignored as it concerns all relationships', {
          node: el
        })
      }
    }
  }
}
