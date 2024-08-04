import { type DiagramEdge, type DiagramNode, type DiagramView, nonNullable, type ViewManualLayout } from '@likec4/core'
import { entries, filter, pipe, take } from 'remeda'

/**
 * When the hash of the diagram view is the same as the previous hash, we can safely apply the layout.
 */
function safeApplyLayout(diagramView: DiagramView, manualLayout: ViewManualLayout): DiagramView {
  const nodes = diagramView.nodes.map(node => {
    const { x, y, width, height } = nonNullable(
      manualLayout.nodes[node.id],
      `Node ${node.id} not found in manual layout`
    )
    return {
      ...node,
      width,
      height,
      position: [x, y]
    } satisfies DiagramNode
  })
  const edges = diagramView.edges.map(edge => {
    const previous = nonNullable(manualLayout.edges[edge.id], `Edge ${edge.id} not found in manual layout`)
    return {
      ...edge,
      ...previous
    } satisfies DiagramEdge
  })
  return {
    ...diagramView,
    width: manualLayout.width,
    height: manualLayout.height,
    nodes,
    edges
  }
}

export function applyManualLayout(diagramView: DiagramView, manualLayout: ViewManualLayout) {
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

  const hasBecomeLarger = () =>
    pipe(
      entries(manualLayout.nodes),
      filter(([fqn, n]) => {
        if (n.isCompound) {
          return false
        }
        const diagramNode = diagramView.nodes.find(n => n.id === fqn)
        if (!diagramNode) {
          return false
        }
        return diagramNode.width > n.width || diagramNode.height > n.height
      }),
      take(1)
    ).length > 0

  if (
    diagramView.nodes.every(n => n.id in manualLayout.nodes)
    && diagramView.edges.every(e => e.id in manualLayout.edges)
    && !hasBecomeLarger()
  ) {
    return {
      diagram: safeApplyLayout(diagramView, manualLayout)
    }
  }

  // Re-layout is required, find nodes where we can pin position
  const pinned = diagramView.nodes.reduce((acc, node) => {
    const manualNode = manualLayout.nodes[node.id]
    // We can't pin the position of groups or if the node is not in the manual layout
    if (node.children.length > 0 || !manualNode) {
      return acc
    }
    acc[node.id] = manualNode
    return acc
  }, {} as ViewManualLayout['nodes'])

  return {
    diagram: diagramView,
    pinned
  }
}
