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
            return
          case ast.isRelationExpr(expr):
          case ast.isInOutExpr(expr):
          case ast.isIncomingExpr(expr):
          case ast.isOutgoingExpr(expr):
          case ast.isElementKindExpr(expr):
          case ast.isElementTagExpr(expr):
          case ast.isWildcardExpr(expr):
            return accept('warning', `Expression is not supported by dynamic views`, {
              node: expr
            })
          default:
            nonexhaustive(expr)
        }
      }
    } catch (e) {
      logError(e)
    }
  }
}
