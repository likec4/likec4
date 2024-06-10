import { nonexhaustive } from '@likec4/core'
import type { ValidationCheck } from 'langium'
import { ast } from '../../ast'
import type { LikeC4Services } from '../../module'

export const expandElementExprChecks = (
  _services: LikeC4Services
): ValidationCheck<ast.ExpandElementExpr> => {
  return (el, accept) => {
    switch (true) {
      case ast.isIncludePredicate(el.$container):
      case ast.isDynamicViewRulePredicate(el.$container):
      case ast.isViewRuleStyle(el.$container):
        return
      case ast.isCustomElementExpr(el.$container):
        return accept('warning', `Custom rules apply only to parent`, {
          node: el
        })
      case ast.isExcludePredicate(el.$container):
        return accept('warning', `Ignored, as can't be used in exclude`, {
          node: el
        })
      case ast.isInOutExpr(el.$container):
      case ast.isIncomingExpr(el.$container):
      case ast.isOutgoingExpr(el.$container):
      case ast.isRelationExpr(el.$container):
        return accept('warning', `Wrong usage of expanded element in relations predicate`, {
          node: el
        })
      default:
        nonexhaustive(el.$container)
    }
  }
}
