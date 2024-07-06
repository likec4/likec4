import { nonexhaustive } from '@likec4/core'
import type { ValidationCheck } from 'langium'
import { ast } from '../../ast'
import type { LikeC4Services } from '../../module'

export const customElementExprChecks = (
  _services: LikeC4Services
): ValidationCheck<ast.CustomElementExpr> => {
  return (el, accept) => {
    if (ast.isExcludePredicate(el.$container)) {
      accept('error', 'Invalid usage inside "exclude"', {
        node: el
      })
    }
    switch (true) {
      case ast.isElementRef(el.target):
        return
      case ast.isExpandElementExpr(el.target):
      case ast.isElementKindExpr(el.target):
      case ast.isElementTagExpr(el.target):
      case ast.isWildcardExpr(el.target):
      case ast.isDescedantsExpr(el.target):
        accept('error', 'Invalid target (expect reference to specific element)', {
          node: el,
          property: 'target'
        })
        return
      default:
        nonexhaustive(el.target)
    }
  }
}
