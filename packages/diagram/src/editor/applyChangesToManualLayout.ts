import { invariant, nonNullable } from '@likec4/core'
import { type VectorValue, BBox, convertPoint, vector } from '@likec4/core/geometry'
import * as t from '@likec4/core/types'
import { castDraft, produce, setAutoFreeze } from 'immer'
import { isNullish, map } from 'remeda'

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
    if (!manual) {
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

    const sourceNode = nodesMap.get(latest.source)!
    const targetNode = nodesMap.get(latest.target)!

    // Add control points - that trigger proper edge rendering
    return makeAsStraightLine(latest, sourceNode, targetNode)
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

function makeAsStraightLine(
  edge: t.DiagramEdge,
  sourceNode: t.DiagramNode,
  targetNode: t.DiagramNode,
): t.DiagramEdge {
  const controlPoints = edgeControlPoints(sourceNode, targetNode)
  const labelPos = controlPoints[0]
  return produce(edge, draft => {
    draft.points = castDraft(map(controlPoints, convertPoint))
    draft.controlPoints = controlPoints
    if (edge.labelBBox) {
      draft.labelBBox!.x = labelPos.x
      draft.labelBBox!.y = labelPos.y
    }
    delete draft.drifts
  })
}

function getBorderPointOnVector(node: BBox, nodeCenter: VectorValue, v: VectorValue) {
  const xScale = node.width / 2 / v.x
  const yScale = node.height / 2 / v.y

  const scale = Math.min(Math.abs(xScale), Math.abs(yScale))

  return vector(v).multiply(scale).add(nodeCenter)
}

function edgeControlPoints(
  source: t.DiagramNode,
  target: t.DiagramNode,
): [t.XYPoint, t.XYPoint] {
  const sourceCenter = vector(BBox.center(source))
  const targetCenter = vector(BBox.center(target))

  // Edge is a loop
  if (source === target) {
    const loopSize = 80
    const centerOfTopBoundary = vector(0, source.height || 0)
      .multiply(-0.5)
      .add(sourceCenter)

    return [
      centerOfTopBoundary.add(vector(-loopSize / 2.5, -loopSize)).trunc().toObject(),
      centerOfTopBoundary.add(vector(loopSize / 2.5, -loopSize)).trunc().toObject(),
    ]
  }

  const sourceToTargetVector = targetCenter.subtract(sourceCenter)
  const sourceBorderPoint = getBorderPointOnVector(source, sourceCenter, sourceToTargetVector)
  const targetBorderPoint = getBorderPointOnVector(target, targetCenter, sourceToTargetVector.multiply(-1))

  const sourceToTarget = targetBorderPoint.subtract(sourceBorderPoint)

  return [
    sourceBorderPoint.add(sourceToTarget.multiply(0.4)).trunc().toObject(),
    sourceBorderPoint.add(sourceToTarget.multiply(0.6)).trunc().toObject(),
  ]
}
