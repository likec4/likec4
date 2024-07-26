import { nonexhaustive } from '@likec4/core'
import type { ValidationCheck } from 'langium'
import { ast, elementExpressionFromPredicate } from '../ast'
import type { LikeC4Services } from '../module'

export const dynamicViewRulePredicate = (
  _services: LikeC4Services
): ValidationCheck<ast.DynamicViewPredicateIterator> => {
  return (predicate, accept) => {
    const expr = elementExpressionFromPredicate(predicate.value)
    switch (true) {
      case ast.isElementRef(expr):
      case ast.isElementDescedantsExpression(expr):
      case ast.isExpandElementExpression(expr):
        return
      case ast.isElementKindExpression(expr):
      case ast.isElementTagExpression(expr):
      case ast.isWildcardExpression(expr): {
        accept('warning', `Predicate is ignored, as not supported in dynamic views`, {
          node: predicate
        })
        return
      }
      default:
        nonexhaustive(expr)
    }
  }
}
