import { difference, filter, map, pipe, sort, tap } from 'remeda'
import { invariant, nonNullable } from '../../errors'
import type { Fqn } from '../../types/element'
import type { ComputedEdge, ComputedNode, EdgeId } from '../../types/view'
import { compareByFqnHierarchically } from '../../utils/fqn'
import { Graph, postorder } from '../../utils/graphlib'
import { compareRelations } from '../../utils/relations'

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
  if (nodes.length < 2) {
    return nodes
  }
  if (edges.length === 0) {
    return pipe(
      nodes,
      sort(compareByFqnHierarchically),
      tap(sortChildren)
    )
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
    g.setNode(n.id, n.id)
    if (n.children.length > 0) {
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

  let sources = g.sources() as unknown as Fqn[]
  if (sources.length === 0) {
    sources = pipe(
      nodes,
      filter(n => n.inEdges.length === 0 || n.parent === null),
      sort(compareByFqnHierarchically),
      map(n => n.id)
    )
  }
  const orderedIds = postorder(g, sources).reverse() as Fqn[]
  const sorted = orderedIds.map(getNode)
  if (sorted.length < nodes.length) {
    const unsorted = difference(nodes, sorted).sort(compareByFqnHierarchically)
    sorted.push(...unsorted)
  }

  invariant(sorted.length === nodes.length, 'Not all nodes were processed by graphlib')
  sortChildren(sorted)
  return sorted
}
