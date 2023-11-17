import type { ValidationCheck } from 'langium'
import { ast } from '../../ast'
import type { LikeC4Services } from '../../module'

export const customElementExprChecks = (
  _services: LikeC4Services
): ValidationCheck<ast.CustomElementExpr> => {
  return (el, accept) => {
    if (ast.isExcludePredicate(el.$container)) {
      accept('error', 'Invalid inside "exclude"', {
        node: el
      })
    }
    if (!ast.isElementRef(el.target)) {
      accept('error', 'Invalid target for customization', {
        node: el,
        property: 'target'
      })
    }
  }
}
