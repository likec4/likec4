import { FqnExpr } from '@likec4/core/types'
import { nonexhaustive } from '@likec4/core/utils'
import type { ValidationCheck } from 'langium'
import { AstUtils } from 'langium'
import { ast, getViewRulePredicateContainer } from '../../ast'
import type { LikeC4Services } from '../../module'
import { tryOrLog } from '../_shared'

export const checkFqnExprWith = (
  services: LikeC4Services,
): ValidationCheck<ast.FqnExprWith> => {
  const modelParser = services.likec4.ModelParser
  return tryOrLog((el, accept) => {
    const container = getViewRulePredicateContainer(el)
    if (container?.$type !== 'DynamicViewIncludePredicate' && container?.isInclude !== true) {
      accept('error', 'Invalid usage inside "exclude"', {
        node: el,
      })
      return
    }
    const isInsideDynamicView = container.$type === 'DynamicViewIncludePredicate'
    const parser = modelParser.forDocument(AstUtils.getDocument(container))
    let expr = FqnExpr.unwrap(parser.parseFqnExprWith(el).custom.expr)

    switch (true) {
      case FqnExpr.isWildcard(expr) && isInsideDynamicView:
      case FqnExpr.isElementKindExpr(expr) && isInsideDynamicView:
      case FqnExpr.isElementTagExpr(expr) && isInsideDynamicView: {
        accept('warning', `Predicate is ignored, as not supported in dynamic views`, {
          node: el,
        })
        return
      }
      case FqnExpr.isWildcard(expr):
      case FqnExpr.isModelRef(expr):
      case FqnExpr.isDeploymentRef(expr):
        return

      case FqnExpr.isElementKindExpr(expr):
      case FqnExpr.isElementTagExpr(expr):
        accept('error', 'Invalid target (expect reference to specific element)', {
          node: el,
          property: 'subject',
        })
        return
      default:
        nonexhaustive(expr)
    }
  })
}
