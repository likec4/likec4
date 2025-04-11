import { type ValidationCheck, AstUtils } from 'langium'
import { isNullish } from 'remeda'
import { ast, getViewRulePredicateContainer } from '../../ast'
import type { LikeC4Services } from '../../module'
import { tryOrLog } from '../_shared'

export const checkOutgoingRelationExpr = (
  _services: LikeC4Services,
): ValidationCheck<ast.OutgoingRelationExpr> => {
  return tryOrLog((el, accept) => {
    const viewRulePredicate = getViewRulePredicateContainer(el)
    if (viewRulePredicate?.$type !== 'ViewRulePredicate') {
      return
    }

    if (el.$container.$type !== 'DirectedRelationExpr' && el.from.$type === 'WildcardExpression') {
      const view = AstUtils.getContainerOfType(el, ast.isElementView)
      if (view && isNullish(view.viewOf)) {
        accept('warning', 'Predicate is ignored as it concerns all relationships', {
          node: el,
        })
      }
    }
  })
}
