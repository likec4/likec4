import { AstUtils, type ValidationCheck } from 'langium'
import { isNonNullish, isNullish } from 'remeda'
import { ast } from '../../ast'
import type { LikeC4Services } from '../../module'
import { tryOrLog } from '../_shared'

// export const deploymentRelationExpressionChecks = (
//   services: LikeC4Services
// ): ValidationCheck<ast.DeploymentRelationExpression> => {
//   return tryOrLog((node, accept) => {
//     if (!AstUtils.hasContainerOfType(node, ast.isDirectedDeploymentRelationExpression)) {
//       accept('warning', 'Not supported yet', {
//         node
//       })
//       return
//     }
//   })
// }

export const deploymentRefExpressionChecks = (
  services: LikeC4Services
): ValidationCheck<ast.DeploymentRefExpression> => {
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

    // Ignore follwoing checks for view rule style
    if (AstUtils.hasContainerOfType(node, ast.isDeploymentViewRuleStyle)) {
      return
    }

    switch (true) {
      case ast.isElement(referenceTo): {
        accept('error', 'Invalid reference, deployment nodes and instances are only allowed', {
          node
        })
        break
      }
      case ast.isDeployedInstance(referenceTo) && isNonNullish(node.selector): {
        accept('error', 'Only deployment nodes can be expanded', {
          node
        })
        break
      }
    }
  })
}
