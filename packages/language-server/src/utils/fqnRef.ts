import { AstUtils } from 'langium'
import { isNullish } from 'remeda'
import { ast } from '../ast'

export function instanceRef(deploymentRef: ast.FqnRef): ast.DeployedInstance | null {
  let referenceable
  while ((referenceable = deploymentRef.value?.ref)) {
    if (ast.isDeploymentNode(referenceable)) {
      return null
    }
    if (ast.isDeployedInstance(referenceable)) {
      return referenceable
    }
    if (isNullish(deploymentRef.parent)) {
      return null
    }
    deploymentRef = deploymentRef.parent
  }
  return null
}

export function deploymentNodeRef(deploymentRef: ast.FqnRef): ast.DeploymentNode | null {
  let referenceable = deploymentRef.value.ref ?? null
  if (!referenceable || ast.isDeploymentNode(referenceable)) {
    return referenceable
  }
  const artifact = instanceRef(deploymentRef)
  // Because path in deploymentRef may be omitted,
  // we find artifact first and then its container
  return artifact ? AstUtils.getContainerOfType(artifact, ast.isDeploymentNode) ?? null : null
}

export function isReferenceToLogicalModel(node: ast.FqnRef) {
  // iterate up the root parent
  while (node.parent) {
    node = node.parent
  }
  return ast.isElement(node.value.ref)
}

/**
 * Returns true if node references deployment model
 */
export function isReferenceToDeploymentModel(node: ast.FqnRef) {
  let referenceable
  while ((referenceable = node.value?.ref)) {
    if (ast.isDeploymentElement(referenceable)) {
      return true
    }
    if (isNullish(node.parent)) {
      return false
    }
    node = node.parent
  }
  return false
}
