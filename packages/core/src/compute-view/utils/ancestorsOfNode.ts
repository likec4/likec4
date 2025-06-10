import type { AnyAux, ComputedNode } from '../../types'
import { nonNullable } from '../../utils'

/**
 * Returns the ancestors of given computed node, starting with the direct parent and ending with the root node.
 */
export function ancestorsOfNode<A extends AnyAux>(
  node: ComputedNode<A>,
  nodes: ReadonlyMap<string, ComputedNode<A>>,
): ReadonlyArray<ComputedNode<A>> {
  const ancestors = [] as ComputedNode<A>[]
  let parentId = node.parent
  while (parentId) {
    const parentNode = nonNullable(nodes.get(parentId), `Parent node ${parentId} not found`)
    ancestors.push(parentNode)
    parentId = parentNode.parent
  }
  return ancestors
}
