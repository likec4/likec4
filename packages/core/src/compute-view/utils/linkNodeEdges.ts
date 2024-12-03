import { last, reverse } from 'remeda'
import { invariant } from '../../errors'
import type { Fqn } from '../../types/element'
import type { ComputedEdge, ComputedNode } from '../../types/view'
import { commonHead } from '../../utils/commonHead'
import { ancestorsOfNode } from './ancestorsOfNode'

/**
 * Mutates nodes and updates their in/out edges
 */
export function linkNodeEdges(nodesMap: ReadonlyMap<Fqn, ComputedNode>, edges: ComputedEdge[]) {
  for (const edge of edges) {
    const source = nodesMap.get(edge.source)
    const target = nodesMap.get(edge.target)
    invariant(source, `Source node ${edge.source} not found`)
    invariant(target, `Target node ${edge.target} not found`)

    source.outEdges.push(edge.id)
    target.inEdges.push(edge.id)

    // These ancestors are reversed: from bottom to top
    const sourceAncestors = ancestorsOfNode(source, nodesMap)
    const targetAncestors = ancestorsOfNode(target, nodesMap)

    const edgeParent = last(
      commonHead(
        reverse(sourceAncestors),
        reverse(targetAncestors)
      )
    )
    edge.parent = edgeParent?.id ?? null

    // Process edge source ancestors
    for (const sourceAncestor of sourceAncestors) {
      if (sourceAncestor === edgeParent) {
        break
      }
      sourceAncestor.outEdges.push(edge.id)
    }
    // Process target hierarchy
    for (const targetAncestor of targetAncestors) {
      if (targetAncestor === edgeParent) {
        break
      }
      targetAncestor.inEdges.push(edge.id)
    }
  }
}
