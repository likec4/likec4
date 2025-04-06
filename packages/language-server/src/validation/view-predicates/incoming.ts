import { type ValidationCheck, AstUtils } from 'langium'
import { isNullish } from 'remeda'
import { ast } from '../../ast'
import type { LikeC4Services } from '../../module'
import { tryOrLog } from '../_shared'

export const checkIncomingRelationExpr = (
  _services: LikeC4Services,
): ValidationCheck<ast.IncomingRelationExpr> => {
  return tryOrLog((el, accept) => {
    if (el.to.$type === 'WildcardExpression' && !ast.isInOutRelationExpr(el.$container)) {
      const view = AstUtils.getContainerOfType(el, ast.isElementView)
      if (isNullish(view?.viewOf)) {
        accept('warning', 'Predicate is ignored as it concerns all relationships', {
          node: el,
        })
      }
    }
  })
}
