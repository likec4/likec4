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
    width: Math.max(manualLayout.width, diagramView.width),
    height: Math.max(manualLayout.height, diagramView.height),
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
  // - no new nodes
  // - no new edges
  // - leaf nodes do not become larger
  // TODO: - edge labels do not become larger

  const anyBecomeLarger = () =>
    pipe(
      entries(manualLayout.nodes),
      filter(([fqn, n]) => {
        if (n.isCompound) {
          return false
        }
        const diagramNode = diagramView.nodes.find(n => n.id === fqn)
        return diagramNode ? hasBecomeLarger(diagramNode, n) : false
      }),
      take(1)
    ).length > 0

  if (
    diagramView.nodes.every(n =>
      n.id in manualLayout.nodes
      && (n.children.length > 0 && manualLayout.nodes[n.id]?.isCompound
        || n.children.length === 0 && !manualLayout.nodes[n.id]?.isCompound)
    )
    && diagramView.edges.every(e => e.id in manualLayout.edges)
    && !anyBecomeLarger()
  ) {
    return {
      diagram: safeApplyLayout(diagramView, manualLayout)
    }
  }

  // Re-layout is required, find nodes where we can pin position
  const pinned = diagramView.nodes.reduce((acc, node) => {
    const manualNode = manualLayout.nodes[node.id]
    // We can't pin the position of groups
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
    if (!manualNode.isCompound && !hasBecomeLarger(node, manualNode)) {
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
