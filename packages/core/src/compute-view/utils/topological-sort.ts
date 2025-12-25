import Graph from 'graphology'
import { topologicalSort as topsort } from 'graphology-dag/topological-sort'
import willCreateCycle from 'graphology-dag/will-create-cycle'
import { forEach, map, partition, pipe, takeWhile } from 'remeda'
import type { AnyAux, ComputedEdge, ComputedNode, NodeId } from '../../types'
import { invariant, nonNullable } from '../../utils'
import { ancestorsOfNode } from './ancestorsOfNode'

/**
 * Keeps initial order of the elements, but ensures parents are placed before children
 */
function ensureParentsFirst<T extends { id: string; parent: string | null }>(
  array: ReadonlyArray<T>,
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
function updateChildren<A extends AnyAux, N extends ComputedNode<A>>(nodes: N[]): N[] {
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

type TopologicalSortParam<
  A extends AnyAux,
  N extends ComputedNode<A> = ComputedNode<A>,
  E extends ComputedEdge<A> = ComputedEdge<A>,
> = {
  nodes: ReadonlyMap<string, N>
  edges: Iterable<E>
}
export function topologicalSort<
  A extends AnyAux,
  N extends ComputedNode<A> = ComputedNode<A>,
  E extends ComputedEdge<A> = ComputedEdge<A>,
>(
  param: TopologicalSortParam<A, N, E>,
): {
  nodes: N[]
  edges: E[]
} {
  let nodes = ensureParentsFirst([...param.nodes.values()])
  let edges = [...param.edges]
  if (nodes.length < 2 || edges.length === 0) {
    return {
      nodes,
      edges,
    }
  }

  const getNode = (id: string) => nonNullable(param.nodes.get(id))

  const g = new Graph({
    multi: true,
    allowSelfLoops: true,
    type: 'directed',
  })

  const enrichedEdges = pipe(
    edges,
    map((edge) => {
      const source = getNode(edge.source),
        target = getNode(edge.target),
        parent = edge.parent ? getNode(edge.parent) : null
      return ({
        id: edge.id,
        edge,
        parent,
        source,
        target,
      })
    }),
  )

  const [edgesBetweenLeafs, edgesWithCompounds] = partition(
    enrichedEdges,
    ({ source, target }) => source.children.length === 0 && target.children.length === 0,
  )

  const sortedEdges = [] as E[]

  const addEdgeToGraph = (edge: E) => {
    g.mergeNode(edge.source)
    g.mergeNode(edge.target)
    sortedEdges.push(edge)
    if (!willCreateCycle(g, edge.source, edge.target)) {
      g.mergeDirectedEdge(edge.source, edge.target)
    }
  }

  for (const { edge, source, target } of edgesBetweenLeafs) {
    addEdgeToGraph(edge)
    // Strengthen the graph by adding edges to parents
    if (target.parent && target.parent !== edge.parent) {
      pipe(
        ancestorsOfNode(target, param.nodes),
        takeWhile(ancestor => ancestor.inEdges.includes(edge.id)),
        forEach(ancestor => {
          g.mergeNode(ancestor.id)
          if (!willCreateCycle(g, edge.source, ancestor.id)) {
            g.mergeDirectedEdge(edge.source, ancestor.id)
          }
          if (!willCreateCycle(g, ancestor.id, edge.target)) {
            g.mergeDirectedEdge(ancestor.id, edge.target)
          }
        }),
      )
    }
    if (source.parent) {
      const sourceParent = getNode(source.parent)
      g.mergeNode(sourceParent.id)
      if (!willCreateCycle(g, sourceParent.id, source.id)) {
        g.mergeDirectedEdge(sourceParent.id, source.id)
      }
      if (target.parent && target.parent !== source.parent) {
        if (!willCreateCycle(g, sourceParent.id, target.parent)) {
          g.mergeDirectedEdge(sourceParent.id, target.parent)
        }
      }
    }
  }
  for (const { edge } of edgesWithCompounds) {
    addEdgeToGraph(edge)
  }

  invariant(sortedEdges.length === edges.length, 'Not all edges were added to the graph')

  const sortedIds = topsort(g)
  let sorted = [] as N[]
  let unsorted = nodes.slice()
  for (const sortedId of sortedIds) {
    const indx = unsorted.findIndex(n => n.id === sortedId)
    invariant(indx >= 0, `Node "${sortedId}" not found`)
    sorted.push(...unsorted.splice(indx, 1))
  }
  // Merge unsorted nodes, keeping their initial order
  if (unsorted.length > 0 && sorted.length > 0) {
    sorted = sorted.flatMap(node => {
      if (unsorted.length === 0) {
        return node
      }
      const wereBefore = nodes
        .slice(0, nodes.indexOf(node))
        .filter(n => unsorted.includes(n))
      if (wereBefore.length > 0) {
        unsorted = unsorted.filter(n => !wereBefore.includes(n))
        return [...wereBefore, node]
      }

      return node
    })
  }
  // Add remaining unsorted nodes
  sorted.push(...unsorted)
  return {
    nodes: updateChildren(
      ensureParentsFirst(sorted),
    ),
    edges: sortedEdges,
  }
}
