import { FqnExpr, FqnRef } from '@likec4/core'
import { AstUtils, type ValidationCheck } from 'langium'
import { isNonNullish, isNullish } from 'remeda'
import { ast } from '../../ast'
import type { LikeC4Services } from '../../module'
import { tryOrLog } from '../_shared'

// export const expressionV2Checks = (
//   services: LikeC4Services
// ): ValidationCheck<ast.ExpressionV2> => {
//   return tryOrLog((node, accept) => {
//     // if (!AstUtils.hasContainerOfType(node, ast.isDirectedDeploymentRelationExpression)) {
//     //   accept('warning', 'Not supported yet', {
//     //     node
//     //   })
//     //   return
//     // }
//   })
// }

export const relationExprChecks = (
  services: LikeC4Services
): ValidationCheck<ast.RelationExpr> => {
  return tryOrLog((node, accept) => {
    // if (!AstUtils.hasContainerOfType(node, ast.isDirectedDeploymentRelationExpression)) {
    //   accept('warning', 'Not supported yet', {
    //     node
    //   })
    //   return
    // }
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
        accept('error', 'Must reference deployment model', {
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

    // // Ignore follwoing checks for view rule style
    // if (AstUtils.hasContainerOfType(node, ast.isDeploymentViewRuleStyle)) {
    //   return
    // }

    // switch (true) {
    //   case ast.isElement(referenceTo): {
    //     accept('error', 'Invalid reference, deployment nodes and instances are only allowed', {
    //       node
    //     })
    //     break
    //   }
    //   case ast.isDeployedInstance(referenceTo) && isNonNullish(node.selector): {
    //     accept('error', 'Only deployment nodes can be expanded', {
    //       node
    //     })
    //     break
    //   }
    // }
  })
}
