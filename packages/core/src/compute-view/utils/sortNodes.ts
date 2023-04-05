import { Relations, compareFqnHierarchically } from '../../utils'
import type { ComputedEdge, ComputedNode } from '../../types'

export function sortNodes(_edges: ComputedEdge[]) {

  const cache = new WeakMap<ComputedNode, {
    in: number,
    out: number
  }>()

  function edgesCount(node: ComputedNode) {
    if (cache.has(node)) {
      return cache.get(node)!
    }
    const result = {
      in: _edges.filter(Relations.isIncoming(node.id)).length,
      out: _edges.filter(Relations.isOutgoing(node.id)).length
    }
    cache.set(node, result)
    return result
  }

  return (a: ComputedNode, b: ComputedNode) => {
    if (a.parent === b.parent) {
      const aedges = edgesCount(a)
      const bedges = edgesCount(b)

      const compareByOut = aedges.out - bedges.out
      if (compareByOut !== 0) {
        return compareByOut * -1
      }
      const compareByIn = aedges.in - bedges.in
      if (compareByIn !== 0) {
        return compareByIn * -1
      }
      const compareByChildren = a.children.length - b.children.length
      if (compareByChildren !== 0) {
        return compareByChildren * -1
      }

      return compareFqnHierarchically(a.id, b.id)
    }
    if (a.parent && !b.parent) {
      return 1
    }
    if (!a.parent && b.parent) {
      return -1
    }
    if (a.parent && b.parent) {
      const compareParents = compareFqnHierarchically(a.parent, b.parent)
      if (compareParents !== 0) {
        return compareParents
      }
    }
    return compareFqnHierarchically(a.id, b.id)
  }
}
