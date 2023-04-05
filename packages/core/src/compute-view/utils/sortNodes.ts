import { both } from 'rambdax'
import type { ComputedEdge, ComputedNode } from '../../types'
import { compareFqnHierarchically } from '../../utils'
import { isBetween, isIncoming, isOutgoing } from '../../utils/relations'

export function sortNodes(_edges: ComputedEdge[]) {

  const cache = new WeakMap<ComputedNode, {
    in: number,
    out: number
  }>()

  function edgesCount(node: ComputedNode) {
    let result = cache.get(node)
    if (result) {
      return result
    }
    result = {
      in: _edges.filter(node.parent ? both(isBetween(node.parent), isIncoming(node.id)) : isIncoming(node.id)).length,
      out: _edges.filter(node.parent ? both(isBetween(node.parent), isOutgoing(node.id)) : isOutgoing(node.id)).length
    }
    cache.set(node, result)
    return result
  }

  return (a: ComputedNode, b: ComputedNode) => {
    if (a.parent === b.parent) {
      const aedges = edgesCount(a)
      const bedges = edgesCount(b)

      const aWeight = aedges.in - aedges.out
      const bWeight = bedges.in - bedges.out
      if (aWeight !== bWeight) {
        return aWeight - bWeight
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
