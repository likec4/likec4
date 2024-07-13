import { nonexhaustive } from '@likec4/core'
import type { ValidationCheck } from 'langium'
import { AstUtils } from 'langium'
import { ast } from '../../ast'
import type { LikeC4Services } from '../../module'

export const customElementExprChecks = (
  _services: LikeC4Services
): ValidationCheck<ast.CustomElementExpression> => {
  return (el, accept) => {
    const container = AstUtils.getContainerOfType(el, ast.isViewRulePredicate)
    if (ast.isExcludePredicate(container)) {
      accept('error', 'Invalid usage inside "exclude"', {
        node: el
      })
    }
    switch (true) {
      case ast.isElementRef(el.target):
      case ast.isElementDescedantsExpression(el.target):
      case ast.isExpandElementExpression(el.target):
        return
      case ast.isElementKindExpression(el.target):
      case ast.isElementTagExpression(el.target):
      case ast.isWildcardExpression(el.target):
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
