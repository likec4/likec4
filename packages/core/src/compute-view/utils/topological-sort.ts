import Graph from 'graphology'
import { topologicalSort as topsort } from 'graphology-dag/topological-sort'
import willCreateCycle from 'graphology-dag/will-create-cycle'
import { forEach, map, partition, pipe, takeWhile } from 'remeda'
import { invariant, nonNullable } from '../../errors'
import type { ComputedEdge, ComputedNode, Fqn, NodeId } from '../../types'
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
  nodes: ReadonlyMap<Fqn, ComputedNode>
  edges: Iterable<ComputedEdge>
}
export function topologicalSort(
  param: TopologicalSortParam,
): {
  nodes: ComputedNode[]
  edges: ComputedEdge[]
} {
  let nodes = ensureParentsFirst([...param.nodes.values()])
  let edges = [...param.edges]
  if (nodes.length < 2 || edges.length === 0) {
    return {
      nodes,
      edges,
    }
  }

  const getNode = (id: Fqn) => nonNullable(param.nodes.get(id))
  // const nodeLevel = (id: string) => getNode(id).level + 1
  //

  const g = new Graph({
    multi: true,
    allowSelfLoops: true,
    type: 'directed',
  })

  const enrichedEdges = pipe(
    edges,
    map((edge, __dirname) => {
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
    // sortBy(
    //   [prop('sourceIndex'), 'asc'],
    //   // [prop('sourceInCount'), 'asc'],
    //   // [prop('sourceLevel'), 'asc'],
    // ),
  )

  const [edgesBetweenLeafs, edgesWithCompounds] = partition(
    enrichedEdges,
    ({ source, target }) => source.children.length === 0 && target.children.length === 0,
  )

  // edgesBetweenLeafs.sort((a, b) => {
  //   if (a.source === b.source) {
  //     return 0
  //   }
  //   if (a.source.level === 0 && b.source.level === 0) {
  //     return 0
  //   }
  //   if (isSameHierarchy(a.source, b.target) || isSameHierarchy(a.target, b.source)) {
  //     return edges.indexOf(a.edge) - edges.indexOf(b.edge)
  //   }
  //   const aLevel = a.parent ? a.parent.level + 1 - a.source.level : a.source.level
  //   const bLevel = b.parent ? b.parent.level + 1 - b.source.level : b.source.level
  //   return aLevel - bLevel
  //   // if (a.source.level === 0 && b.source.level === 0) {

  //   //   // if (a.source.depth)
  //   //   return nodes.indexOf(a.target) - nodes.indexOf(b.target)
  //   // }
  //   // if (a.source.level === 0 && b.source.level > 0) {
  //   //   return -1
  //   // }
  //   // if (a.parent && b.parent && a.parent !== b.parent) {
  //   //   if (a.parent.level !== b.parent.level) {
  //   //     return b.parent.level - a.parent.level
  //   //   } else {
  //   //     return nodes.indexOf(a.parent) - nodes.indexOf(b.parent)
  //   //   }
  //   // }
  //   // return Math.min(nodes.indexOf(a.source), nodes.indexOf(a.target)) - Math.min(nodes.indexOf(b.source), nodes.indexOf(b.target))
  // })
  const sortedEdges = [] as ComputedEdge[]

  const addEdgeToGraph = (edge: ComputedEdge) => {
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

    // addEdgeToGraph(edge)
  }
  for (const { edge } of edgesWithCompounds) {
    addEdgeToGraph(edge)
  }

  invariant(sortedEdges.length === edges.length, 'Not all edges were added to the graph')

  // for (const compound of nodes) {
  //   if (compound.children.length === 0 || compound.inEdges.length === 0) {
  //     continue
  //   }
  //   // g.mergeNode(compound.id)
  //   for (const inEdge of compound.inEdges) {
  //     const { edge, source } = getEdge(inEdge)
  //     // ignore if this edge is coming from compound node
  //     if (source.children.length > 0) {
  //       continue
  //     }
  //     // if this edge is coming to the compound node directly
  //     if (edge.target === compound.id) {
  //       // for (const child of compound.children) {
  //       //   // g.mergeNode(child)
  //       //   if (!willCreateCycle(g, edge.source, child)) {
  //       //     g.mergeDirectedEdge(edge.source, child)
  //       //   }
  //       // }
  //     } else {
  //       if (!willCreateCycle(g, edge.source, compound.id)) {
  //         g.mergeDirectedEdge(edge.source, compound.id)
  //       }
  //       if (!willCreateCycle(g, compound.id, edge.target)) {
  //         g.mergeDirectedEdge(compound.id, edge.target)
  //       }
  //     }
  //   }
  // }

  const sortedIds = topsort(g)
  let sorted = [] as ComputedNode[]
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
