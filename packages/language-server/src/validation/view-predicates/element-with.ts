import { nonexhaustive } from '@likec4/core'
import type { ValidationCheck } from 'langium'
import { AstUtils } from 'langium'
import { ast } from '../../ast'
import type { LikeC4Services } from '../../module'
import { tryOrLog } from '../_shared'

export const elementPredicateWithChecks = (
  _services: LikeC4Services,
): ValidationCheck<ast.ElementPredicateWith> => {
  return tryOrLog((el, accept) => {
    const container = AstUtils.getContainerOfType(el, ast.isViewRulePredicate)
    if (ast.isExcludePredicate(container)) {
      accept('error', 'Invalid usage inside "exclude"', {
        node: el,
      })
    }
    const subject = ast.isElementPredicateWhere(el.subject) ? el.subject.subject : el.subject
    switch (true) {
      case ast.isElementRef(subject):
      case ast.isElementDescedantsExpression(subject):
      case ast.isExpandElementExpression(subject):
      case ast.isWildcardExpression(subject):
        return
      case ast.isElementKindExpression(subject):
      case ast.isElementTagExpression(subject):
        accept('error', 'Invalid target (expect reference to specific element)', {
          node: el,
          property: 'subject',
        })
        return
      default:
        nonexhaustive(subject)
    }
  })
}
