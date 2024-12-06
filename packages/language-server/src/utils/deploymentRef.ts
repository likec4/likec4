import { AstUtils } from 'langium'
import { isNullish } from 'remeda'
import { ast } from '../ast'

export function instanceRef(deploymentRef: ast.DeploymentRef): ast.DeployedInstance | null {
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

export function deploymentNodeRef(deploymentRef: ast.DeploymentRef): ast.DeploymentNode | null {
  let referenceable = deploymentRef.value.ref ?? null
  if (!referenceable || ast.isDeploymentNode(referenceable)) {
    return referenceable
  }
  const artifact = instanceRef(deploymentRef)
  // Because path in deploymentRef may be omitted,
  // we find artifact first and then its container
  return artifact ? AstUtils.getContainerOfType(artifact, ast.isDeploymentNode) ?? null : null
}
