import Graph from 'graphology'
import { topologicalSort as topsort } from 'graphology-dag/topological-sort'
import willCreateCycle from 'graphology-dag/will-create-cycle'
import { forEach, map, pipe, prop, sortBy } from 'remeda'
import { invariant, nonNullable } from '../../errors'
import type { ComputedEdge, ComputedNode, NodeId } from '../../types'
import { isAncestor } from '../../utils'

const isNested = (nested: ComputedEdge, parent: ComputedEdge) => {
  const isSameSource = nested.source === parent.source
  const isSameTarget = nested.target === parent.target
  if (isSameSource && isSameTarget) {
    return false
  }
  const isSourceNested = isAncestor(parent.source, nested.source)
  const isTargetNested = isAncestor(parent.target, nested.target)
  return (
    (isSourceNested && isTargetNested)
    || (isSameSource && isTargetNested)
    || (isSameTarget && isSourceNested)
  )
}

const findDeepestNestedEdge = (connections: ReadonlyArray<ComputedEdge>, edge: ComputedEdge) => {
  let deepest = edge
  for (const c of connections) {
    if (isNested(c, deepest)) {
      deepest = c
    }
  }
  return deepest !== edge ? deepest : null
}

const sortDeepestFirst = (edges: ReadonlyArray<ComputedEdge>) => {
  const sorted = [] as ComputedEdge[]
  const unsorted = edges.slice()
  let next
  while (next = unsorted.shift()) {
    let deepest
    while (deepest = findDeepestNestedEdge(unsorted, next)) {
      const index = unsorted.indexOf(deepest)
      sorted.push(unsorted.splice(index, 1)[0]!)
    }
    sorted.push(next)
  }
  return sorted
}

/**
 * Keeps initial order of the elements, but ensures that parents are before children
 */
function ensureParentsFirst<T extends { id: string; parent: string | null }>(
  array: ReadonlyArray<T>
): Array<T> {
  const result = [] as T[]
  const items = [...array]
  let item
  while ((item = items.shift())) {
    let parent = item.parent
    if (parent) {
      const ancestors = [] as T[]
      while (parent) {
        const parentIndx = items.findIndex(i => i.id === parent)
        if (parentIndx < 0) {
          break
        }
        const [parentItem] = items.splice(parentIndx, 1)
        if (!parentItem) {
          throw new Error('Invalid state, should not happen')
        }
        ancestors.unshift(parentItem)
        parent = parentItem.parent
      }
      result.push(...ancestors)
    }
    result.push(item)
  }
  return result as Array<T>
}

/**
 * Side effect, mutates node.children field to preserve same order as in the input
 */
function updateChildren(nodes: ComputedNode[]) {
  nodes.forEach(parent => {
    if (parent.children.length > 0) {
      parent.children = nodes.reduce((acc, n) => {
        if (n.parent === parent.id) {
          acc.push(n.id)
        }
        return acc
      }, [] as NodeId[])
    }
  })
  return nodes
}

type TopologicalSortParam = {
  nodes: Iterable<ComputedNode>
  edges: Iterable<ComputedEdge>
}
export function topologicalSort(
  param: TopologicalSortParam
): {
  nodes: ComputedNode[]
  edges: ComputedEdge[]
} {
  let nodes = [...param.nodes]
  let edges = [...param.edges]
  if (nodes.length < 2) {
    return {
      nodes,
      edges
    }
  }
  nodes = ensureParentsFirst(nodes)

  if (edges.length === 0) {
    return {
      nodes,
      edges
    }
  }

  const getNode = (id: string) => nonNullable(nodes.find(n => n.id === id))
  const nodeLevel = (id: string) => getNode(id).level + 1
  const getEdge = (id: string) => nonNullable(edges.find(edge => edge.id === id))

  const g = new Graph({
    multi: true,
    allowSelfLoops: true,
    type: 'directed'
  })

  for (const n of nodes) {
    g.addNode(n.id)
  }
  const sortedEdges = [] as ComputedEdge[]

  pipe(
    edges,
    map(e => ({
      e,
      parentLevel: e.parent ? nodeLevel(e.parent) : 0,
      nodeLevel: Math.max(nodeLevel(e.source), nodeLevel(e.target)),
      sourceIndex: nodes.findIndex(n => n.id === e.source),
      targetIndex: nodes.findIndex(n => n.id === e.target)
    })),
    sortBy(
      [prop('parentLevel'), 'desc'],
      [prop('nodeLevel'), 'desc'],
      [prop('sourceIndex'), 'asc'],
      [prop('targetIndex'), 'asc']
    ),
    map(prop('e')),
    sortDeepestFirst,
    forEach((e, idx, _all) => {
      sortedEdges.push(e)
      if (idx === 0 || !willCreateCycle(g, e.source, e.target)) {
        g.mergeDirectedEdge(e.source, e.target)
      }
    })
  )

  // Strengthen the graph by adding edges to compound nodes
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
    if (n.parent && !willCreateCycle(g, n.parent, n.id)) {
      g.mergeDirectedEdge(n.parent, n.id)
    }
  }

  const sortedIds = topsort(g)
  const sorted = [] as ComputedNode[]
  for (const sortedId of sortedIds) {
    const indx = nodes.findIndex(n => n.id === sortedId)
    invariant(indx >= 0, `Node "${sortedId}" not found`)
    sorted.push(...nodes.splice(indx, 1))
  }
  if (nodes.length > 0) {
    sorted.push(...nodes)
  }
  return {
    nodes: pipe(
      sorted,
      ensureParentsFirst,
      updateChildren
    ),
    edges: sortedEdges
  }
}
