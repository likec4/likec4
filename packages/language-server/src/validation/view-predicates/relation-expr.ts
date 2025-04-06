import { FqnExpr, RelationExpr } from '@likec4/core'
import { type ValidationCheck, AstUtils } from 'langium'
import { ast } from '../../ast'
import type { LikeC4Services } from '../../module'
import { tryOrLog } from '../_shared'

export const checkRelationExpr = (services: LikeC4Services): ValidationCheck<ast.RelationExpr> => {
  const ModelParser = services.likec4.ModelParser
  return tryOrLog((node, accept) => {
    // if (node.$container.$type !== 'DeploymentViewRulePredicateExpression') {
    //   // skip validation for this node, validated by container
    //   return
    // }

    const predicate = AstUtils.getContainerOfType(node, ast.isDeploymentViewRulePredicate)
    if (!predicate || predicate.isInclude !== true) {
      // no restriction for exclude predicate
      return
    }

    const doc = AstUtils.getDocument(node)
    const parser = ModelParser.forDocument(doc)
    let relationExpr = RelationExpr.unwrap(parser.parseRelationExpr(node))

    const ModelRefOnlyExclude = 'Model reference is allowed in exclude predicate only'

    if (RelationExpr.isDirect(relationExpr)) {
      if (FqnExpr.isModelRef(relationExpr.source) || FqnExpr.isModelRef(relationExpr.target)) {
        accept('error', ModelRefOnlyExclude, {
          node: node,
        })
      }
      return
    }

    let expr
    if (RelationExpr.isIncoming(relationExpr)) {
      expr = relationExpr.incoming
    } else if (RelationExpr.isOutgoing(relationExpr)) {
      expr = relationExpr.outgoing
    } else {
      expr = relationExpr.inout
    }
    if (FqnExpr.isModelRef(expr)) {
      accept('error', ModelRefOnlyExclude, {
        node,
      })
      return
    }
  })
}
