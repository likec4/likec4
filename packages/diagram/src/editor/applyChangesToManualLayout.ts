import { invariant, nonNullable } from '@likec4/core'
import { BBox } from '@likec4/core/geometry'
import type * as t from '@likec4/core/types'
import { compareByFqnHierarchically, parentFqn } from '@likec4/core/utils'
import { difference, differenceWith, map, omit, pick, pipe, sort } from 'remeda'

/**
 * Applies changes to a manual layout.
 *
 * @param manual - The manual layout.
 * @param latest - The latest layout.
 */
export function applyChangesToManualLayout(
  manualView: t.LayoutedElementView,
  latestView: t.LayoutedElementView,
): t.LayoutedElementView {
  invariant(manualView.id === latestView.id, 'View IDs do not match')
  invariant(manualView._type === latestView._type, 'View types do not match')

  const {
    added,
    updated,
  } = nodesDiff(manualView, latestView)

  const nodesMap = new Map<t.NodeId, t.DiagramNode>()

  const sortednodes = pipe(
    [...updated, ...added],
    sort(compareByFqnHierarchically),
  )
  for (const { id, ...node } of sortednodes) {
    let parent = parentFqn(id)
    let level = 0
    let parentNd: t.DiagramNode | undefined
    // Find the first ancestor that is already in the map
    while (parent) {
      parentNd = nodesMap.get(parent)
      if (parentNd) {
        break
      }
      parent = parentFqn(parent)
    }
    if (parentNd) {
      // if parent has no children and we are about to add first one
      // we need to set its depth to 1
      if (parentNd.children.length == 0) {
        parentNd.depth = 1
        // go up the tree and update depth of all parents
        updateDepthOfAncestors(parentNd, nodesMap)
      }
      parentNd.children.push(id)
      level = parentNd.level + 1
    }
    nodesMap.set(id, {
      id,
      ...node,
      parent,
      level,
      children: [],
      inEdges: [],
      outEdges: [],
      depth: 0,
    })
  }

  // Expand compound nodes to wrap their children with proper padding
  expandCompoundNodes(nodesMap)

  const nodes = [...nodesMap.values()]

  // Recalculate view bounds (around all root nodes)
  const bounds = BBox.merge(...nodes.filter(n => !n.parent))

  return {
    ...omit(manualView, [
      'drifts',
      'title',
      'description',
      'links',
      'tags',
      'hasLayoutDrift',
      'viewOf',
      'extends',
    ]),
    ...pick(latestView, [
      'title',
      'description',
      'links',
      'tags',
      'viewOf',
      'extends',
    ]),
    bounds,
    edges: [],
    nodes: [...nodesMap.values()],
  }
}

function updateDepthOfAncestors(node: t.DiagramNode, nodes: ReadonlyMap<t.NodeId, t.DiagramNode>) {
  let parentNd
  while (!!node.parent && (parentNd = nodes.get(node.parent))) {
    const depth = parentNd.depth ?? 1
    parentNd.depth = Math.max(depth, (node.depth ?? 0) + 1)
    if (parentNd.depth === depth) {
      // stop if we didn't change depth
      break
    }
    node = parentNd
  }
}

/**
 * Padding constants for compound nodes (same as in useLayoutConstraints)
 */
const COMPOUND_PADDING = {
  Left: 42,
  Right: 42,
  Top: 60,
  Bottom: 42,
} as const

/**
 * Expands compound nodes to wrap all their children with proper padding.
 * Processes nodes recursively from leaves up to ensure correct bounding boxes.
 */
function expandCompoundNodes(nodes: Map<t.NodeId, t.DiagramNode>): void {
  // Recursively expand compound nodes from leaves up
  function expand(nodeId: t.NodeId): t.DiagramNode {
    const node = nonNullable(nodes.get(nodeId), `Node ${nodeId} not found`)
    if (node.children.length === 0) {
      return node
    }

    // First expand all children
    const childBBoxes = [] as BBox[]
    for (const childId of node.children) {
      childBBoxes.push(
        expand(childId),
      )
    }
    const childrenBBox = BBox.merge(...childBBoxes)

    // Apply padding and update node dimensions
    node.x = childrenBBox.x - COMPOUND_PADDING.Left
    node.y = childrenBBox.y - COMPOUND_PADDING.Top
    node.width = childrenBBox.width + COMPOUND_PADDING.Left + COMPOUND_PADDING.Right
    node.height = childrenBBox.height + COMPOUND_PADDING.Top + COMPOUND_PADDING.Bottom

    return node
  }

  // Expand all compound nodes
  for (const node of nodes.values()) {
    if (node.children.length > 0) {
      expand(node.id)
    }
  }
}

export function nodesDiff(
  manualView: t.LayoutedView,
  latestView: t.LayoutedView,
) {
  const removed = differenceWith(
    manualView.nodes,
    latestView.nodes,
    (a, b) => a.id === b.id,
  )
  const added = differenceWith(
    latestView.nodes,
    manualView.nodes,
    (a, b) => a.id === b.id,
  )

  const updated = pipe(
    difference(
      manualView.nodes,
      removed,
    ),
    map(existing => {
      const updated = nonNullable(
        latestView.nodes.find(n => n.id === existing.id),
        `updated node ${existing.id} not found in latest view`,
      )
      return applyNodeChanges(existing, updated)
    }),
  )

  return {
    removed,
    added,
    updated,
  }
}

function applyNodeChanges(
  current: t.DiagramNode,
  updated: t.DiagramNode,
) {
  invariant(current.id === updated.id, 'Node IDs do not match')

  // Take everything from updated except position
  const next = structuredClone(updated)
  next.x = current.x
  next.y = current.y
  next.width = current.width
  next.height = current.height

  // Delete drift reasons
  next.drifts = null

  // If updated node has no children, it means its size is not determined by children
  if (updated.children.length === 0) {
    next.width = updated.width
    next.height = updated.height
  }

  // Reset data, will be recalculated later
  next.parent = null
  next.children = []
  next.inEdges = []
  next.outEdges = []
  next.level = 0
  next.depth = 0

  return next
}
