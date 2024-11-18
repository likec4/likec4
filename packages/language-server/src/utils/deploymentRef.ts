import { AstUtils } from 'langium'
import { ast } from '../ast'

export function instanceRef(deploymentRef: ast.DeploymentRef): ast.DeployedInstance | null {
  let referenceable
  while (referenceable = deploymentRef.value.ref) {
    if (ast.isDeployedInstance(referenceable)) {
      return referenceable
    }
    if (ast.isDeploymentNode(referenceable) || !deploymentRef.parent) {
      break
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
