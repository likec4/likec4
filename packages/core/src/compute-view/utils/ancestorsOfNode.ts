import { nonNullable } from '../../errors'
import type { ComputedNode, Fqn } from '../../types'

/**
 * Returns the ancestors of the given node, starting with the direct parent and ending with the root node.
 */
export function* ancestorsOfNode(node: ComputedNode, nodes: ReadonlyMap<Fqn, ComputedNode>) {
  let parent = node.parent
  while (parent) {
    const parentNode = nonNullable(nodes.get(parent), `Parent node ${parent} not found`)
    yield parentNode
    // ancestors.push(parentNode)
    parent = parentNode.parent
  }
}
