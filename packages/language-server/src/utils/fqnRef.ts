import { isNullish } from 'remeda'
import { ast } from '../ast'

export function referenceableParent(node: ast.FqnRef): ast.Referenceable | null {
  // iterate up the root parent
  while (node.parent) {
    node = node.parent
  }
  return node.value.ref ?? null
}

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

export function importsRef(node: ast.FqnRef): ast.Imported | null {
  const referenceable = referenceableParent(node)
  return referenceable?.$type === 'Imported' ? referenceable : null
}

/**
 * Returns true if node references deployment model
 */
export function isReferenceToDeploymentModel(node: ast.FqnRef): boolean {
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
