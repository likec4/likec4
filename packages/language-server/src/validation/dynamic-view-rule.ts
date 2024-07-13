import { nonexhaustive } from '@likec4/core'
import type { ValidationCheck } from 'langium'
import { ast } from '../ast'
import type { LikeC4Services } from '../module'

export const dynamicViewRulePredicate = (
  _services: LikeC4Services
): ValidationCheck<ast.DynamicViewRulePredicateIterator> => {
  return (expr, accept) => {
    switch (true) {
      case ast.isElementRef(expr.value):
      case ast.isElementDescedantsExpression(expr.value):
      case ast.isCustomElementExpression(expr.value):
      case ast.isExpandElementExpression(expr.value):
        return
      case ast.isElementKindExpression(expr.value):
      case ast.isElementTagExpression(expr.value):
      case ast.isWildcardExpression(expr.value): {
        accept('warning', `Predicate is ignored, as not supported in dynamic views`, {
          node: expr
        })
        return
      }
      default:
        nonexhaustive(expr.value)
    }
  }
}
