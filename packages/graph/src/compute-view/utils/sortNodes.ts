import pkg from '@dagrejs/graphlib'
import {
  compareByFqnHierarchically,
  compareRelations,
  type ComputedEdge,
  type ComputedNode,
  type EdgeId,
  type Fqn,
  invariant,
  nonNullable
} from '@likec4/core'
import { difference, filter, map, pipe, sort, take } from 'remeda'

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
    multigraph: false
  })

  const getNode = (id: Fqn) =>
    nonNullable(
      nodes.find(n => n.id === id),
      'Edge not found'
    )
  const getEdge = (id: EdgeId) =>
    nonNullable(
      edges.find(edge => edge.id === id),
      'Edge not found'
    )

  for (const e of [...edges].sort(compareRelations)) {
    g.setEdge(e.source, e.target)
  }

  for (const n of nodes) {
    g.setNode(n.id)
    if (n.children.length > 0) {
      // n.children.forEach(c => {
      //   g.setEdge(n.id, c, undefined, `${n.id}:${c}`)
      // })
      n.inEdges.forEach(e => {
        const edge = getEdge(e)
        // if this edge from leaf to the child of this node
        if (edge.target !== n.id && getNode(edge.source).children.length === 0) {
          // const id = `${edge.source}:${n.id}`
          g.setEdge(edge.source, n.id)
        }
      })
      // n.outEdges.forEach(e => {
      //   const edge = getEdge(e)
      //   if (edge.source !== n.id) {
      //     const id = `${n.id}:${edge.target}`
      //     g.setEdge(n.id, edge.target, undefined, id)
      //   }
      // })
    }
    if (n.parent) {
      g.setEdge(n.parent, n.id)
    }
  }

  let sources = g.sources()
  if (sources.length === 0) {
    sources = pipe(
      nodes,
      sort(compareByFqnHierarchically),
      filter(n => n.inEdges.length === 0 || n.parent === null),
      map(n => n.id)
    )
  }
  const orderedIds = alg.postorder(g, sources).reverse() as Fqn[]
  const sorted = orderedIds.map(getNode)
  if (sorted.length < nodes.length) {
    const unsorted = difference(nodes, sorted)
    sorted.push(...unsorted)
  }

  invariant(sorted.length === nodes.length, 'Not all nodes were processed by graphlib')
  sortChildren(sorted)
  return sorted
}
