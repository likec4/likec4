import { type ValidationCheck, AstUtils } from 'langium'
import { isNullish } from 'remeda'
import { ast } from '../../ast'
import type { LikeC4Services } from '../../module'
import { tryOrLog } from '../_shared'

export const incomingExpressionChecks = (
  _services: LikeC4Services,
): ValidationCheck<ast.IncomingRelationExpression> => {
  return tryOrLog((el, accept) => {
    if (ast.isWildcardExpression(el.to) && !ast.isInOutRelationExpression(el.$container)) {
      const view = AstUtils.getContainerOfType(el, ast.isElementView)
      if (isNullish(view?.viewOf)) {
        accept('warning', 'Predicate is ignored as it concerns all relationships', {
          node: el,
        })
      }
    }
  })
}
