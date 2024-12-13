import { FqnExpr, FqnRef } from '@likec4/core'
import { AstUtils, type ValidationCheck } from 'langium'
import { isNonNullish, isNullish } from 'remeda'
import { ast } from '../../ast'
import type { LikeC4Services } from '../../module'
import { tryOrLog } from '../_shared'

export const relationExprChecks = (services: LikeC4Services): ValidationCheck<ast.RelationExpr> => {
  const ModelParser = services.likec4.ModelParser
  return tryOrLog((node, accept) => {
    if (node.$container.$type !== 'DeploymentViewRulePredicateExpression') {
      // skip validation for this node, validated by container
      return
    }

    const predicate = AstUtils.getContainerOfType(node, ast.isDeploymentViewRulePredicate)
    if (!predicate || predicate.isInclude !== true) {
      // no restriction for exclude predicate
      return
    }

    const doc = AstUtils.getDocument(node)
    const parser = ModelParser.forDocument(doc)

    const ModelRefOnlyExclude = 'Model reference is allowed in exclude predicate only'

    if (ast.isDirectedRelationExpr(node)) {
      if (FqnExpr.isModelRef(parser.parseFqnExpr(node.source.from))) {
        accept('error', ModelRefOnlyExclude, {
          node: node.source,
          property: 'from'
        })
      }

      if (FqnExpr.isModelRef(parser.parseFqnExpr(node.target))) {
        accept('error', ModelRefOnlyExclude, {
          node,
          property: 'target'
        })
      }
      return
    }

    let expr: ast.FqnExpr
    if (ast.isIncomingRelationExpr(node)) {
      expr = node.to
    } else if (ast.isOutgoingRelationExpr(node)) {
      expr = node.from
    } else {
      expr = node.inout.to
    }
    if (FqnExpr.isModelRef(parser.parseFqnExpr(expr))) {
      accept('error', ModelRefOnlyExclude, {
        node
      })
      return
    }
  })
}

export const fqnRefExprChecks = (services: LikeC4Services): ValidationCheck<ast.FqnRefExpr> => {
  const ModelParser = services.likec4.ModelParser
  // const DeploymentsIndex = services.likec4.DeploymentsIndex
  // const Names = services.references.NameProvider as LikeC4NameProvider
  // const Locator = services.workspace.AstNodeLocator
  // const fqnIndex = services.likec4.FqnIndex
  return tryOrLog((node, accept) => {
    const referenceTo = node.ref.value.ref
    if (isNullish(referenceTo)) {
      accept('error', 'Invalid empty reference', {
        node
      })
      return
    }
    const doc = AstUtils.getDocument(node)
    const expr = ModelParser.forDocument(doc).parseFqnRefExpr(node)

    // This expression is part of element predicate
    if (node.$container.$type === 'DeploymentViewRulePredicateExpression') {
      if (FqnExpr.isModelRef(expr)) {
        accept('error', 'Deployment view predicate must reference deployment model', {
          node
        })
        return
      }
      if (FqnExpr.isDeploymentRef(expr) && FqnRef.isInsideInstanceRef(expr.ref)) {
        accept('error', 'Must reference deployment nodes or instances, but not internals', {
          node
        })
        return
      }
    }

    if (!ast.isDeploymentNode(referenceTo) && isNonNullish(node.selector)) {
      accept('warning', `Selector '${node.selector}' applies to deployment nodes only, ignored here`, {
        node,
        property: 'selector'
      })
    }
  })
}
