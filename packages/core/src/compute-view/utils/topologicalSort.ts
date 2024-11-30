import { MultiDirectedGraph } from 'graphology'
import { topologicalSort as topsort } from 'graphology-dag/topological-sort'
import willCreateCycle from 'graphology-dag/will-create-cycle'
import { invariant, nonNullable } from '../../errors'
import type { ComputedEdge, ComputedNode, EdgeId, Fqn } from '../../types'
import { isAncestor, type IterableContainer, type ReorderedArray } from '../../utils/fqn'

/**
 * Keeps initial order of the elements, but ensures that parents are before children
 */
function ensureParentsFirst<T extends { id: string; parent: string | null }>(
  array: Array<T>
): Array<T> {
  const result = [] as T[]
  const items = [...array]
  let item
  while ((item = items.shift())) {
    let parent = item.parent
    while (parent) {
      const parentIndx = items.findIndex(i => i.id === parent)
      if (parentIndx < 0) {
        break
      }
      const [parentItem] = items.splice(parentIndx, 1)
      if (!parentItem) {
        throw new Error('Invalid state, should not happen')
      }
      result.push(parentItem)
      parent = parentItem.parent
    }
    result.push(item)
  }
  return result as Array<T>
}

// side effect
function updateChildren(nodes: readonly ComputedNode[]) {
  nodes.forEach(parent => {
    if (parent.children.length > 0) {
      parent.children = nodes.flatMap(n => (n.parent === parent.id ? n.id : []))
    }
  })
}

export function topologicalSort({
  nodes,
  edges
}: {
  nodes: ComputedNode[]
  edges: ComputedEdge[]
}): ComputedNode[] {
  if (nodes.length < 2) {
    return nodes
  }
  nodes = ensureParentsFirst(nodes)

  if (edges.length === 0) {
    updateChildren(nodes)
    return nodes
  }

  const getNode = (id: string) => nonNullable(nodes.find(n => n.id === id))

  const getEdge = (id: string) => nonNullable(edges.find(edge => edge.id === id))

  const g = new MultiDirectedGraph()

  for (const n of nodes) {
    g.addNode(n.id)
  }
  for (const e of edges) {
    if (willCreateCycle(g, e.source, e.target)) {
      continue
    }
    g.mergeDirectedEdge(e.source, e.target)
  }

  for (const n of nodes) {
    if (n.children.length > 0) {
      n.inEdges.forEach(e => {
        const edge = getEdge(e)
        // if this edge from leaf to the child of this node
        if (edge.target !== n.id && getNode(edge.source).children.length === 0) {
          if (!willCreateCycle(g, edge.source, n.id)) {
            g.mergeDirectedEdge(edge.source, n.id)
          }
        }
      })
    }
  }
  const topsorted = topsort(g)
  if (topsorted.length < nodes.length) {
    nodes.forEach(n => {
      if (!topsorted.includes(n.id)) {
        topsorted.push(n.id)
      }
    })
  }
  nodes = topsort(g).map(getNode)
  nodes = ensureParentsFirst(nodes)
  updateChildren(nodes)
  return nodes
}
