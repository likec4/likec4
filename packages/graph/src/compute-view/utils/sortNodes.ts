import pkg from '@dagrejs/graphlib'
import type { ComputedEdge, ComputedNode } from '@likec4/core'

// '@dagrejs/graphlib' is a CommonJS module
// Here is a workaround to import it
const { Graph, alg } = pkg

// side effect
function fillChildren(nodes: readonly ComputedNode[]) {
  nodes.forEach(node => (node.children = nodes.flatMap(n => (n.parent === node.id ? n.id : []))))
  return nodes as ComputedNode[]
}

export function sortNodes(
  _nodes: readonly ComputedNode[],
  edges: readonly ComputedEdge[]
): ComputedNode[] {
  if (edges.length === 0) {
    return fillChildren(_nodes)
  }

  const g = new Graph({
    compound: true,
    directed: true,
    multigraph: false
  })

  for (const e of edges) {
    g.setEdge(e.source, e.target)
  }
  for (const n of _nodes) {
    g.setNode(n.id)
    if (n.parent) {
      g.setEdge(n.id, n.parent)
    }
  }

  const unprocessed = [..._nodes]
  const sorted = [] as ComputedNode[]

  const ordered = alg.postorder(g, g.sources()).reverse()
  for (const id of ordered) {
    const inx = unprocessed.findIndex(n => n.id === id)
    if (inx >= 0) {
      sorted.push(...unprocessed.splice(inx, 1))
    }
  }
  return fillChildren(unprocessed.concat(sorted))
}
