import pkg from '@dagrejs/graphlib'
import type { ComputedEdge, ComputedNode } from '../../types'

// '@dagrejs/graphlib' is a CommonJS module
// Here is a workaround to import it
const { Graph, alg } = pkg

function fillChildren(nodes: ComputedNode[]) {
  return nodes.map(node => ({
    ...node,
    children: nodes.flatMap(n => (n.parent === node.id ? n.id : []))
  }))
}

export function sortNodes(_nodes: ComputedNode[], edges: ComputedEdge[]) {
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
  return fillChildren(sorted.concat(unprocessed))
}
