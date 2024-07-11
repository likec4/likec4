import { nonexhaustive } from '@likec4/core'
import type { ValidationCheck } from 'langium'
import { ast } from '../ast'
import { logError } from '../logger'
import type { LikeC4Services } from '../module'

export const dynamicViewRulePredicate = (_services: LikeC4Services): ValidationCheck<ast.DynamicViewRulePredicate> => {
  return (el, accept) => {
    try {
      for (const expr of el.expressions) {
        switch (true) {
          case ast.isElementRef(expr):
          case ast.isDescedantsExpr(expr):
          case ast.isCustomElementExpr(expr):
          case ast.isExpandElementExpr(expr):
            continue
          case ast.isElementKindExpr(expr):
          case ast.isElementTagExpr(expr):
          case ast.isWildcardExpr(expr): {
            accept('warning', `Predicate is ignored, as not supported in dynamic views`, {
              node: expr
            })
            continue
          }
          default:
            nonexhaustive(expr)
        }
      }
    } catch (e) {
      logError(e)
    }
  }
}
