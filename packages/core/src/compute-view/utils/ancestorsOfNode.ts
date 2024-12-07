import { nonNullable } from '../../errors'
import type { ComputedNode, Fqn } from '../../types'

/**
 * Returns the ancestors of the given node, starting with the direct parent and ending with the root node.
 */
export function ancestorsOfNode(
  node: ComputedNode,
  nodes: ReadonlyMap<Fqn, ComputedNode>
): ReadonlyArray<ComputedNode> {
  const ancestors = [] as ComputedNode[]
  let parentId = node.parent
  while (parentId) {
    const parentNode = nonNullable(nodes.get(parentId), `Parent node ${parentId} not found`)
    ancestors.push(parentNode)
    parentId = parentNode.parent
  }
  return ancestors
}
