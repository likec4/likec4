import { type DiagramEdge, type DiagramNode, type DiagramView, type ViewManualLayout, NodeId } from '@likec4/core'
import { BBox, Vector } from '@likec4/core/geometry'
import { deepEqual } from 'fast-equals'

type NodeManualLayout = ViewManualLayout['nodes'][string]

const nodeSep = 100
const rankSep = 100
const containerMargin = { top: 50, right: 40, bottom: 40, left: 40 }
/**
 * When the hash of the diagram view is the same as the previous hash, we can safely apply the layout.
 */
function safeApplyLayout(diagramView: DiagramView, manualLayout: ViewManualLayout): DiagramView {
  const nodes = diagramView.nodes.map(node => {
    const previous = manualLayout.nodes[node.id]
    if (!previous) {
      return node
    }
    const { x, y, width, height } = previous
    return {
      ...node,
      width,
      height,
      x,
      y,
    } satisfies DiagramNode
  })
  const edges = diagramView.edges.map(edge => {
    const previous = manualLayout.edges[edge.id]
    if (!previous) {
      return edge
    }
    return {
      ...edge,
      ...previous,
    } satisfies DiagramEdge
  })
  return {
    ...diagramView,
    bounds: {
      x: manualLayout.x,
      y: manualLayout.y,
      width: manualLayout.width,
      height: manualLayout.height,
    },
    nodes,
    edges,
  }
}

export function applyManualLayout(
  diagramView: DiagramView,
  manualLayout: ViewManualLayout,
): DiagramView {
  const nodes = new Map(diagramView.nodes.map(node => [node.id, node]))

  if (
    diagramView.hash === manualLayout.hash
    || canApplySafely(diagramView, manualLayout)
  ) {
    // We still need to adjust size of compounds as one of their children might have been removed
    adjustCompoundNodes(diagramView.nodes.filter(node => !node.parent), nodes, manualLayout)

    return safeApplyLayout(diagramView, manualLayout)
  }

  // @ts-expect-error hasLayoutDrift is deprecated
  diagramView.hasLayoutDrift = true

  // Place new nodes
  const previousBb = BBox.merge(
    ...diagramView.nodes
      .map(node => manualLayout.nodes[node.id]!)
      .filter(n => !!n),
  )
  diagramView.nodes
    .filter(node => node.parent == null)
    .reduce(
      (acc, node) => layoutNode(node, acc, nodes, manualLayout),
      { x: previousBb.x, y: previousBb.y + previousBb.height + rankSep },
    )

  // Add new edges
  diagramView.edges
    .filter(edge => !manualLayout.edges[edge.id])
    .forEach(edge => layoutEdge(edge, manualLayout))

  return safeApplyLayout(diagramView, manualLayout)
}

function layoutNode(
  node: DiagramNode,
  basePoint: { x: number; y: number },
  nodes: Map<NodeId, DiagramNode>,
  manualLayout: ViewManualLayout,
): { x: number; y: number } {
  let nodeLayout = manualLayout.nodes[node.id]
  const wasCompound = nodeLayout?.isCompound ?? false
  const isNew = !nodeLayout
  const placeAt = isNew
    // It's a new node, we'll place it at base point
    ? basePoint
    // It's an existing node, we'll leave it where it is
    : { x: nodeLayout!.x, y: nodeLayout!.y }

  // Layout children
  const previousChildren = node.children
    .map(child => manualLayout.nodes[child]!)
    .filter(n => !!n)
  const oldChildrenBb = previousChildren.length > 0 && BBox.merge(...previousChildren)

  const placeChildrenAt = wasCompound && oldChildrenBb
    // Place new children under the old ones
    ? {
      x: oldChildrenBb.x,
      y: oldChildrenBb.y + oldChildrenBb.height + rankSep,
    }
    // Place new children as a content of the parent
    : {
      x: placeAt.x + containerMargin.left,
      y: placeAt.y + containerMargin.top,
    }
  node.children
    .map(child => nodes.get(child))
    .reduce(
      (acc, child) => layoutNode(child!, acc, nodes, manualLayout),
      placeChildrenAt,
    )

  // Layout node itself
  nodeLayout = node.children.length > 0
    ? buildCompoundNodeLayout(node, manualLayout)
    : manualLayout.nodes[node.id] ?? {
      isCompound: false,
      width: node.width,
      height: node.height,
      x: placeAt.x,
      y: placeAt.y,
    }
  manualLayout.nodes[node.id] = nodeLayout

  return isNew
    // It's a new node, the next one should be placed to the right
    ? { x: nodeLayout.x + nodeLayout.width + nodeSep, y: nodeLayout.y }
    // It's an existing node, it did not use the basePoint
    : basePoint
}

function layoutEdge(edge: DiagramEdge, manualLayout: ViewManualLayout) {
  const source = manualLayout.nodes[edge.source]!
  const target = manualLayout.nodes[edge.target]!

  const sourceCenter = toVector(BBox.center(source))
  const targetCenter = toVector(BBox.center(target))
  const edgeVector = targetCenter.subtract(sourceCenter)

  const { x: middlePointX, y: middlePointY } = edgeVector.divide(2).add(sourceCenter)

  const labelBBox = {
    ...(edge?.labelBBox ?? { width: 0, height: 0 }),
    x: middlePointX,
    y: middlePointY,
  }

  const controlPoint = edgeVector.multiply(0.7).add(sourceCenter)
  const middlePoint = edgeVector.multiply(0.3).add(sourceCenter)
  manualLayout.edges[edge.id] = {
    points: [
      [sourceCenter.x, sourceCenter.y],
      [middlePoint.x, middlePoint.y],
      [controlPoint.x, controlPoint.y],
      [targetCenter.x, targetCenter.y],
    ],
    labelBBox,
    controlPoints: [controlPoint],
  }
}

function adjustCompoundNodes(
  nodesToAdjust: DiagramNode[],
  nodes: Map<NodeId, DiagramNode>,
  manualLayout: ViewManualLayout,
) {
  nodesToAdjust
    .filter(node => node.children.length > 0)
    .forEach(node => {
      adjustCompoundNodes(
        node.children
          .map(child => nodes.get(child)!)
          .filter(n => !!n),
        nodes,
        manualLayout,
      )
      manualLayout.nodes[node.id] = buildCompoundNodeLayout(node, manualLayout)
    })
}

function buildCompoundNodeLayout(node: DiagramNode, manualLayout: ViewManualLayout): NodeManualLayout {
  const childrenBb = BBox.merge(...node.children.map(child => manualLayout.nodes[child]!))

  return {
    isCompound: true,
    x: childrenBb.x - containerMargin.left,
    y: childrenBb.y - containerMargin.top,
    width: childrenBb.width + containerMargin.left + containerMargin.right,
    height: childrenBb.height + containerMargin.top + containerMargin.bottom,
  }
}

function canApplySafely(diagramView: DiagramView, manualLayout: ViewManualLayout): boolean {
  const isCompound = (node: DiagramNode) => node.children.length > 0

  // We still can safely apply the layout:
  // - autoLayout is the same
  // - no new nodes
  // - compound nodes do not become leaf nodes and vice versa
  // - no new edges
  return deepEqual(diagramView.autoLayout, manualLayout.autoLayout)
    && diagramView.nodes.every(n => {
      const manualNode = manualLayout.nodes[n.id]
      return !!manualNode
        && isCompound(n) === manualNode.isCompound
    })
    && diagramView.edges.every(e => !!manualLayout.edges[e.id])
}

function toVector({ x, y }: { x: number; y: number }) {
  return new Vector(x, y)
}
