import type { ValidationCheck } from 'langium'
import { isNullish } from 'remeda'
import { ast } from '../../ast'
import type { LikeC4Services } from '../../module'

export const outgoingExpressionChecks = (
  _services: LikeC4Services
): ValidationCheck<ast.OutgoingExpr> => {
  return (el, accept) => {
    if (ast.isWildcardExpr(el.from)) {
      const view = el.$container.$container.$container
      if (view.$type === 'ElementView' && isNullish(view.viewOf)) {
        accept('warning', 'Predicate is ignored as it concerns all relationships', {
          node: el
        })
      }
    }
  }
}
