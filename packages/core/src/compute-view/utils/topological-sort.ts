// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import Graph from 'graphology'
import { topologicalSort as topsort } from 'graphology-dag/topological-sort'
import willCreateCycle from 'graphology-dag/will-create-cycle'
import { map, partition, pipe } from 'remeda'
import type { AnyAux, ComputedEdge, ComputedNode, NodeId } from '../../types'
import { invariant, nonNullable } from '../../utils'

/**
 * Keeps initial order of the elements, but ensures parents are placed before children.
 *
 * Precondition: if `item.parent` is non-null, the parent ID must appear in the array.
 * This is guaranteed by `buildComputedNodes`, which always sets `node.parent` to the
 * nearest ancestor that exists in the computed-nodes map — never to a gap.
 */
function ensureParentsFirst<T extends { id: string; parent: string | null }>(
  array: ReadonlyArray<T>,
): Array<T> {
  if (array.length < 2) {
    return [...array]
  }
  const result = [] as T[]
  const remaining = new Map<string, T>()
  for (const item of array) {
    remaining.set(item.id, item)
  }

  // Collect all ancestors that are still in the remaining set, from root down.
  // Stops at the first parent not found — either already emitted or not in the array.
  const collectAncestors = (item: T): T[] => {
    const chain = [] as T[]
    let parentId = item.parent
    while (parentId) {
      const parentItem = remaining.get(parentId)
      if (!parentItem) break
      chain.push(parentItem)
      parentId = parentItem.parent
    }
    // Reverse so root ancestors come first
    return chain.reverse()
  }

  for (const item of array) {
    if (!remaining.has(item.id)) {
      continue // already emitted as an ancestor of a previous item
    }
    const ancestors = collectAncestors(item)
    for (const ancestor of ancestors) {
      if (remaining.delete(ancestor.id)) {
        result.push(ancestor)
      }
    }
    if (remaining.delete(item.id)) {
      result.push(item)
    }
  }

  return result
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
    // Walk ancestors of target inline (no array allocation)
    if (target.parent && target.parent !== edge.parent) {
      let ancestorId: string | null = target.parent
      while (ancestorId) {
        const ancestor = param.nodes.get(ancestorId)
        if (!ancestor || !ancestor.inEdges.includes(edge.id)) {
          break
        }
        g.mergeNode(ancestor.id)
        if (!willCreateCycle(g, edge.source, ancestor.id)) {
          g.mergeDirectedEdge(edge.source, ancestor.id)
        }
        if (!willCreateCycle(g, ancestor.id, edge.target)) {
          g.mergeDirectedEdge(ancestor.id, edge.target)
        }
        ancestorId = ancestor.parent
      }
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

  // Build index of unsorted nodes for O(1) lookups
  const unsortedIndex = new Map<string, { node: N; originalIdx: number }>()
  for (let i = 0; i < nodes.length; i++) {
    unsortedIndex.set(nodes[i]!.id, { node: nodes[i]!, originalIdx: i })
  }

  let sorted = [] as N[]
  for (const sortedId of sortedIds) {
    const entry = unsortedIndex.get(sortedId)
    invariant(entry, `Node "${sortedId}" not found`)
    sorted.push(entry.node)
    unsortedIndex.delete(sortedId)
  }

  // Merge unsorted nodes (those not in the topsort graph), keeping their initial order
  if (unsortedIndex.size > 0 && sorted.length > 0) {
    const unsortedNodes = [...unsortedIndex.values()]
      .sort((a, b) => a.originalIdx - b.originalIdx)
      .map(e => e.node)

    // Build a map from node id to original index for O(1) lookup
    const originalIndexOf = new Map<string, number>()
    for (let i = 0; i < nodes.length; i++) {
      originalIndexOf.set(nodes[i]!.id, i)
    }

    let unsortedIdx = 0
    sorted = sorted.flatMap(node => {
      if (unsortedIdx >= unsortedNodes.length) {
        return node
      }
      const nodeOrigIdx = originalIndexOf.get(node.id)!
      const preceding = [] as N[]
      while (unsortedIdx < unsortedNodes.length) {
        const unsortedOrigIdx = originalIndexOf.get(unsortedNodes[unsortedIdx]!.id)!
        if (unsortedOrigIdx >= nodeOrigIdx) break
        preceding.push(unsortedNodes[unsortedIdx]!)
        unsortedIdx++
      }
      return preceding.length > 0 ? [...preceding, node] : node
    })
    // Add any remaining unsorted nodes at the end
    while (unsortedIdx < unsortedNodes.length) {
      sorted.push(unsortedNodes[unsortedIdx]!)
      unsortedIdx++
    }
  }
  return {
    nodes: updateChildren(
      ensureParentsFirst(sorted),
    ),
    edges: sortedEdges,
  }
}
