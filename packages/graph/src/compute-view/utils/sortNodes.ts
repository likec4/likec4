import pkg from '@dagrejs/graphlib'
import {
  invariant,
  nonNullable,
  type ComputedEdge,
  type ComputedNode,
  type EdgeId
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

export function sortNodes({
  nodes,
  edges
}: {
  nodes: ComputedNode[]
  edges: ComputedEdge[]
}): ComputedNode[] {
  if (edges.length === 0) {
    return nodes
  }

  const g = new Graph({
    compound: false,
    directed: true,
    multigraph: true
  })

  for (const e of edges) {
    g.setEdge(e.source, e.target, undefined, e.id)
  }

  const getEdge = (id: EdgeId) =>
    nonNullable(
      edges.find(edge => edge.id === id),
      'Edge not found'
    )

  for (const n of nodes) {
    g.setNode(n.id)
    if (n.children.length > 0) {
      n.inEdges.forEach(e => {
        const edge = getEdge(e)
        if (edge.target !== n.id) {
          const id = `${edge.source}:${n.id}`
          g.setEdge(edge.source, n.id, undefined, id)
        }
      })
      n.outEdges.forEach(e => {
        const edge = getEdge(e)
        if (edge.source !== n.id) {
          const id = `${n.id}:${edge.target}`
          g.setEdge(n.id, edge.target, undefined, id)
        }
      })
    }
    if (n.parent) {
      g.setEdge(n.id, n.parent, undefined, `${n.id}:${n.parent}`)
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
