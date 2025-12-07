import { invariant, isStepEdgeId, nonNullable } from '@likec4/core'
import { BBox } from '@likec4/core/geometry'
import * as t from '@likec4/core/types'
import { castDraft, produce, setAutoFreeze } from 'immer'
import { isNullish } from 'remeda'
import { bezierControlPoints } from '../utils/xyflow'

/**
 * Applies changes to a manual layout.
 *
 * @param manual - The manual layout.
 * @param latest - The latest layout.
 */
export function applyChangesToManualLayout(
  manualView: t.LayoutedView,
  latestView: t.LayoutedView,
): t.LayoutedView {
  // Disable auto-freeze during this operation
  try {
    setAutoFreeze(false)
    return _applyChangesToManualLayout(manualView, latestView)
  } finally {
    setAutoFreeze(true)
  }
}

const isRootNode = (node: t.DiagramNode) => isNullish(node.parent)

function _applyChangesToManualLayout(
  manualView: t.LayoutedView,
  latestView: t.LayoutedView,
): t.LayoutedView {
  invariant(manualView.id === latestView.id, 'View IDs do not match')
  invariant(manualView._type === latestView._type, 'View types do not match')
  invariant(manualView._layout === 'manual' && latestView._layout === 'auto', 'Views must be manual and auto')

  const compounds = new Set<t.NodeId>()
  const newnodes = new Set<t.NodeId>()

  const isNotCompound = (node: t.DiagramNode | t.NodeId) => !compounds.has(typeof node === 'string' ? node : node.id)
  const isBetweenNewLeafNodes = (edge: t.DiagramEdge) =>
    newnodes.has(edge.source)
    && newnodes.has(edge.target)
    && isNotCompound(edge.source)
    && isNotCompound(edge.target)

  const nodesMap = new Map<t.NodeId, t.DiagramNode>(
    latestView.nodes.map(latest => {
      // register compound nodes to track them later
      if (latest.children && latest.children.length > 0) {
        compounds.add(latest.id)
      }

      const manual = manualView.nodes.find(n => n.id === latest.id)
      if (manual) {
        return [latest.id, applyFromManualNode({ latest, manual })]
      }

      newnodes.add(latest.id)
      return [latest.id, removeDrift(latest)] as const
    }),
  )

  const newNodesOnly = newnodes.size === nodesMap.size

  if (newNodesOnly) {
    // When only new nodes are added, we just take latest view
    return produce(latestView, draft => {
      draft._layout = 'manual'
      draft.nodes = castDraft([...nodesMap.values()])
      draft.edges = castDraft(latestView.edges.map(removeDrift))

      // Clear drifts
      delete draft.drifts
    })
  }

  if (compounds.size > 0) {
    expandCompoundNodes(nodesMap)
  }

  // Order is preserved from MAP
  const nodes = [...nodesMap.values()]

  const edges = latestView.edges.map(latest => {
    const dir = latest.dir ?? 'forward'
    // find matching edge in manual view by endpoints
    const hasSameEndpoints = (candidate: t.DiagramEdge) =>
      candidate.source === latest.source
      && candidate.target === latest.target
      && (candidate.dir === dir || (!candidate.dir && !latest.dir))

    let manual = manualView.edges.find(e => e.id === latest.id && hasSameEndpoints(e))
    if (!manual && !isStepEdgeId(latest.id)) {
      manual = manualView.edges.find(e => hasSameEndpoints(e))
    }

    if (manual) {
      return applyFromManualEdge({
        latest,
        manual,
      })
    }

    if (isBetweenNewLeafNodes(latest)) {
      return removeDrift(latest)
    }

    // Add control points - that trigger proper edge rendering
    return removeDrift({
      ...latest,
      controlPoints: bezierControlPoints(latest.points),
    })
  })

  // Recalculate view bounds (around all root nodes)
  const bounds = BBox.merge(...nodes.filter(isRootNode))

  return produce(latestView, draft => {
    draft._layout = 'manual'
    draft.nodes = castDraft(nodes)
    draft.edges = castDraft(edges)
    draft.bounds = bounds
    // Clear drifts
    delete draft.drifts
  })
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

  // traverse root nodes, and expand compounds
  for (const node of nodes.values()) {
    if (!isRootNode(node) || node.children.length === 0) {
      continue
    }
    expand(node.id)
  }
}

function applyFromManualNode({ latest, manual }: {
  manual: t.DiagramNode
  latest: t.DiagramNode
}) {
  invariant(manual.id === latest.id, 'Node IDs do not match')
  return produce(latest, next => {
    next.x = manual.x
    next.y = manual.y
    // Delete drift reasons
    next.drifts = null
  })
}

function applyFromManualEdge(edges: {
  manual: t.DiagramEdge
  latest: t.DiagramEdge
}): t.DiagramEdge {
  const { manual, latest } = edges
  return produce(latest, (draft) => {
    if (manual.controlPoints) {
      draft.controlPoints = manual.controlPoints
    } else {
      delete draft.controlPoints
    }
    draft.points = castDraft(manual.points)
    if (manual.labelBBox) {
      draft.labelBBox = latest.labelBBox ?? manual.labelBBox
      // Take label position from manual layout
      draft.labelBBox.x = manual.labelBBox.x
      draft.labelBBox.y = manual.labelBBox.y
    }

    draft.drifts = null
  })
}

function removeDrift<T extends {}>(object: T): T {
  if ('drifts' in object && object.drifts !== null) {
    const result = { ...object }
    result.drifts = null
    return result
  }
  return object
}
