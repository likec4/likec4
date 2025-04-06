import { FqnExpr, FqnRef, nonexhaustive } from '@likec4/core'
import type { ValidationCheck } from 'langium'
import { AstUtils } from 'langium'
import { isNonNullish } from 'remeda'
import { ast, getViewRulePredicateContainer, isFqnRefInsideDeployment } from '../../ast'
import type { LikeC4Services } from '../../module'
import { tryOrLog } from '../_shared'

export const checkFqnRefExpr = (
  services: LikeC4Services,
): ValidationCheck<ast.FqnRefExpr> => {
  const modelParser = services.likec4.ModelParser
  return tryOrLog((node, accept) => {
    const parser = modelParser.forDocument(AstUtils.getDocument(node))
    const expr = parser.parseFqnRefExpr(node)
    const viewRulePredicate = getViewRulePredicateContainer(node)

    if (viewRulePredicate?.$type === 'DeploymentViewRulePredicate' || isFqnRefInsideDeployment(node)) {
      const isPartOfRelationExpr = AstUtils.hasContainerOfType(node, ast.isRelationExpr)
      // This expression is part of element predicate
      if (!isPartOfRelationExpr) {
        if (FqnExpr.isModelRef(expr)) {
          accept('error', 'Deployment view predicate must reference deployment model', {
            node,
          })
          return
        }
        if (FqnExpr.isDeploymentRef(expr) && FqnRef.isInsideInstanceRef(expr.ref)) {
          accept('error', 'Must reference deployment nodes or instances, but not internals', {
            node,
          })
          return
        }
      }

      if (FqnExpr.isDeploymentRef(expr) && FqnRef.isInsideInstanceRef(expr.ref) && isNonNullish(expr.selector)) {
        accept('warning', `Selector '${expr.selector}' applies to deployment nodes only, ignored here`, {
          node,
          property: 'selector',
        })
      }
      return
    }

    if (viewRulePredicate?.$type === 'DynamicViewIncludePredicate') {
      switch (true) {
        case FqnExpr.isElementKindExpr(expr):
        case FqnExpr.isElementTagExpr(expr):
        case FqnExpr.isWildcard(expr): {
          accept('warning', `Predicate is ignored, as not supported in dynamic views`, {
            node,
          })
          return
        }
      }
    }
  })
}
