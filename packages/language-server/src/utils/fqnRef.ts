import { isNullish } from 'remeda'
import { ast } from '../ast'

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
