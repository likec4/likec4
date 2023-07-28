import { isSameHierarchy } from '../..'
import type { ComputedEdge, ComputedNode, Fqn } from '../../types'

import { Graph, alg } from '@dagrejs/graphlib'

export function sortNodes(_nodes: Map<Fqn, ComputedNode>, edges: ComputedEdge[]) {
  const g = new Graph({
    compound: true,
    directed: true,
    multigraph: false
  })

  for (const nd of _nodes.values()) {
    g.setNode(nd.id)
    // console.log(`add ${nd.id}`)
    if (nd.parent) {
      g.setEdge(nd.parent, nd.id)
      // console.log(`${nd.parent} -> ${nd.id}`)
    }
  }

  for (const edge of edges) {
    const source = _nodes.get(edge.source)
    let target = _nodes.get(edge.target)
    while (source && target) {
      if (!isSameHierarchy(source, target) && !g.hasEdge(source.id, target.id)) {
        g.setEdge(source.id, target.id)
        // console.log(`${source.id} -> ${target.id}`)
        if (!alg.isAcyclic(g)) {
          g.removeEdge(source.id, target.id)
          // console.log(`remove ${source.id} -> ${target.id}`)
        }
      }
      if (target.parent && target.parent !== edge.parent) {
        target = _nodes.get(target.parent)
      } else {
        target = undefined
      }
    }
  }

  const sorted = alg.topsort(g) as Fqn[]
  const nodes = sorted.map(id => _nodes.get(id)!)

  for (const node of nodes) {
    node.children = nodes.flatMap(n => (n.parent === node.id ? n.id : []))
  }

  return nodes
}
