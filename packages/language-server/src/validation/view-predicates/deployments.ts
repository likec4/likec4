import { nonexhaustive } from '@likec4/core'
import { AstUtils, type ValidationCheck } from 'langium'
import { isNullish } from 'remeda'
import { ast } from '../../ast'
import type { LikeC4Services } from '../../module'
import type { LikeC4NameProvider } from '../../references'
import { tryOrLog } from '../_shared'

export const deploymentRefExpressionChecks = (
  services: LikeC4Services
): ValidationCheck<ast.DeploymentRefExpression> => {
  // const DeploymentsIndex = services.likec4.DeploymentsIndex
  // const Names = services.references.NameProvider as LikeC4NameProvider
  // const Locator = services.workspace.AstNodeLocator
  // const fqnIndex = services.likec4.FqnIndex
  return tryOrLog((node, accept) => {
    const referenceTo = node.ref.value.ref
    switch (true) {
      case isNullish(referenceTo):
        break
      case ast.isElement(referenceTo): {
        accept('error', 'Invalid reference, deployment nodes and instances are only allowed', {
          node
        })
        break
      }
      case ast.isDeployedInstance(referenceTo) && (node.isExpand || node.isNested): {
        accept('error', 'Only deployment nodes can be expanded', {
          node
        })
        break
      }
    }
  })
}
