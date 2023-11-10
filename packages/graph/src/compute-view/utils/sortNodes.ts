import pkg from '@dagrejs/graphlib'
import {
  invariant,
  isSameHierarchy,
  nonNullable,
  type ComputedEdge,
  type ComputedNode
} from '@likec4/core'
import { difference } from 'remeda'

// '@dagrejs/graphlib' is a CommonJS module
// Here is a workaround to import it
const { Graph, alg } = pkg

// side effect
function sortChildren(nodes: readonly ComputedNode[]) {
  nodes.forEach(parent => {
    if (parent.children.length > 0) {
      parent.children = nodes.flatMap(n => (n.parent === parent.id ? n.id : []))
    }
  })
}

export function sortNodes(
  nodes: readonly ComputedNode[],
  edges: readonly ComputedEdge[]
): ComputedNode[] {
  if (edges.length === 0) {
    return nodes as ComputedNode[]
  }

  const g = new Graph({
    compound: false,
    directed: true,
    multigraph: false
  })

  for (const e of edges) {
    g.setEdge(e.source, e.target)
    const source = nonNullable(
      nodes.find(n => n.id === e.source),
      'Edge source not found'
    )
    if (source.parent && !isSameHierarchy(source.parent, e.target)) {
      g.setEdge(source.parent, e.target)
    }
  }

  for (const n of nodes) {
    g.setNode(n.id)
    if (n.parent) {
      g.setEdge(n.id, n.parent)
    }
  }

  const orderedIds = alg.postorder(g, g.sources()).reverse()

  if (orderedIds.length < nodes.length) {
    const nodeIds = nodes.map(n => n.id)
    const unsorted = difference(nodeIds, orderedIds)
    orderedIds.unshift(...unsorted)
  }
  invariant(orderedIds.length === nodes.length, 'Not all nodes were processed by graphlib')

  const sorted = orderedIds.flatMap(id => nodes.find(n => n.id === id) ?? [])
  invariant(sorted.length === nodes.length, 'Not all sorted nodes were found')

  sortChildren(sorted)
  return sorted
}
