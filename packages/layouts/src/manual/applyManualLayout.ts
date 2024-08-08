import { type DiagramEdge, type DiagramNode, type DiagramView, nonNullable, type ViewManualLayout } from '@likec4/core'
import { entries, filter, pipe, take } from 'remeda'
import type { MergeExclusive, SetRequired } from 'type-fest'
import type { ApplyManualLayoutData } from '../graphviz/DotPrinter'

type ManualNode = ViewManualLayout['nodes'][string]
type ManualEdge = ViewManualLayout['edges'][string]

type ManualEdgeWithDotPos = SetRequired<ManualEdge, 'dotpos'>

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
      position: [x, y]
    } satisfies DiagramNode
  })
  const edges = diagramView.edges.map(edge => {
    const previous = manualLayout.edges[edge.id]
    if (!previous) {
      return edge
    }
    return {
      ...edge,
      ...previous
    } satisfies DiagramEdge
  })
  return {
    ...diagramView,
    bounds: {
      x: Math.min(manualLayout.x, diagramView.bounds.x),
      y: Math.min(manualLayout.y, diagramView.bounds.y),
      width: Math.max(manualLayout.width, diagramView.bounds.width),
      height: Math.max(manualLayout.height, diagramView.bounds.height)
    },
    nodes,
    edges
  }
}

const hasBecomeLarger = (diagramNode: DiagramNode, manualNode: ManualNode) =>
  diagramNode.width > manualNode.width + 10 || diagramNode.height > manualNode.height + 10

export function applyManualLayout(
  diagramView: DiagramView,
  manualLayout: ViewManualLayout
): MergeExclusive<{ diagram: DiagramView }, { relayout: ApplyManualLayoutData }> {
  if (diagramView.hash === manualLayout.hash) {
    return {
      diagram: safeApplyLayout(diagramView, manualLayout)
    }
  }

  // If the hash is different, we still can safely apply the layout:
  // - autoLayout is the same
  // - no new nodes
  // - compound nodes do not become leaf nodes and vice versa
  // - no new edges
  // - leaf nodes do not become larger
  // TODO: - edge labels do not become larger
  if (
    diagramView.autoLayout === manualLayout.autoLayout
    && diagramView.nodes.every(n => {
      const manualNode = manualLayout.nodes[n.id]
      return !!manualNode
        && (
          n.children.length > 0 && manualNode.isCompound
          || n.children.length === 0 && !manualNode.isCompound
        )
        // Only check for leaf nodes
        && (manualNode.isCompound || hasBecomeLarger(n, manualNode) === false)
    })
    && diagramView.edges.every(e => e.id in manualLayout.edges)
  ) {
    return {
      diagram: safeApplyLayout(diagramView, manualLayout)
    }
  }

  // Re-layout is required, find nodes where we can pin position
  const pinned = diagramView.nodes.reduce((acc, node) => {
    const manualNode = manualLayout.nodes[node.id]
    // We can't pin the position of compounds
    // Or this is a new node
    if (node.children.length > 0 || !manualNode) {
      return acc
    }
    const _pinned: ApplyManualLayoutData['nodes'][number] = {
      id: node.id,
      center: {
        x: manualNode.x + manualNode.width / 2,
        y: manualNode.y + manualNode.height / 2
      }
    }
    if (!(manualNode.isCompound || hasBecomeLarger(node, manualNode))) {
      _pinned.fixedsize = {
        width: manualNode.width,
        height: manualNode.height
      }
    }
    acc.push(_pinned)
    return acc
  }, [] as ApplyManualLayoutData['nodes'])

  return {
    relayout: {
      height: manualLayout.height,
      nodes: pinned,
      edges: entries(manualLayout.edges).flatMap(([id, edge]) => {
        if (edge.dotpos) {
          return {
            id,
            dotpos: edge.dotpos
          }
        }
        return []
      })
    }
  }
}
